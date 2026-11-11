import base64
import json
import re
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).parent.resolve()
DIST = ROOT / 'dist'
CONTENT = ROOT / 'content.json'
MAX_BODY = 64 * 1024 * 1024
SLUG_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
IMAGE_PATTERN = re.compile(r'^data:image/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate_pair(value, label):
    require(isinstance(value, list) and len(value) == 2, f'{label} must have English and Dari values.')
    require(all(isinstance(part, str) for part in value), f'{label} values must be text.')


def validate_slug_list(items, label):
    slugs = []
    for item in items:
        slug = item.get('slug')
        require(isinstance(slug, str) and SLUG_PATTERN.fullmatch(slug), f'{label} has an invalid URL name (slug). Use lowercase letters, numbers and hyphens.')
        slugs.append(slug)
    require(len(slugs) == len(set(slugs)), f'{label} URL names (slugs) must be unique.')


def validate_image(value, label):
    if not value:
        return
    require(isinstance(value, str), f'{label} image must be an uploaded image or URL.')
    if value.startswith('data:image/'):
        match = IMAGE_PATTERN.fullmatch(value)
        require(match is not None, f'{label} image data is invalid.')
        try:
            image_data = base64.b64decode(match.group(2), validate=True)
        except ValueError as error:
            raise ValueError(f'{label} image data is invalid.') from error
        require(len(image_data) <= 8 * 1024 * 1024, f'{label} image exceeds the 8 MB limit.')
    else:
        require(value.startswith('/assets/') or value.startswith('https://'), f'{label} image must use /assets/ or HTTPS.')


def normalize_uploaded_images(data):
    assets = DIST / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    for collection, field in (('projects', 'image'), ('team', 'portrait')):
        for index, item in enumerate(data[collection]):
            value = item.get(field, '')
            if not isinstance(value, str) or not value.startswith('data:image/'):
                continue
            match = IMAGE_PATTERN.fullmatch(value)
            require(match is not None, f'{collection.title()} image data is invalid.')
            image_data = base64.b64decode(match.group(2), validate=True)
            require(len(image_data) <= 8 * 1024 * 1024, f'{collection.title()} image exceeds the 8 MB limit.')
            ext = {'jpeg': 'jpg'}.get(match.group(1), match.group(1))
            name = item.get('slug') or f'team-{index + 1}'
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '-', name)
            filename = f'{safe_name}-upload.{ext}'
            (assets / filename).write_bytes(image_data)
            item[field] = '/assets/' + filename


def validate_content(data):
    require(isinstance(data, dict), 'Content must be a JSON object.')
    for key in ('business', 'brand', 'services', 'projects', 'articles', 'team', 'testimonials'):
        require(key in data, f'Missing content section: {key}.')
    require(isinstance(data['business'], dict), 'Business details must be an object.')
    for key in ('name', 'email', 'phone', 'location', 'hours', 'origin', 'formEndpoint'):
        require(isinstance(data['business'].get(key, ''), str), f'Business field {key} must be text.')
    require(isinstance(data['business'].get('socials', []), list), 'Social profiles must be a list.')
    for social in data['business'].get('socials', []):
        require(isinstance(social, dict) and isinstance(social.get('label', ''), str) and isinstance(social.get('url', ''), str), 'Each social profile needs a label and URL.')
    require(isinstance(data['brand'], dict), 'Brand settings must be an object.')
    for key, legacy in (('primary', 'primaryBlue'), ('accent', 'accentTurquoise'), ('ink', 'deepInk'), ('background', 'white')):
        value = data['brand'].get(key, data['brand'].get(legacy))
        require(isinstance(value, str) and re.fullmatch(r'#[0-9a-fA-F]{6}', value), f'Brand color {key} must be a six-digit hex color.')

    for collection in ('services', 'projects', 'articles', 'team', 'testimonials'):
        require(isinstance(data[collection], list), f'{collection.title()} must be a list.')
    validate_slug_list(data['services'], 'Services')
    validate_slug_list(data['projects'], 'Projects')
    validate_slug_list(data['articles'], 'Articles')

    for service in data['services']:
        for key in ('en', 'fa'):
            require(isinstance(service.get(key), str), f'Service {key} name must be text.')
        for key in ('intro', 'problem'):
            validate_pair(service.get(key), f'Service {key}')
        deliverables = service.get('deliverables')
        require(isinstance(deliverables, list) and len(deliverables) == 2 and all(isinstance(group, list) and all(isinstance(line, str) for line in group) for group in deliverables), 'Service deliverables must be two lists of text.')
        require(service.get('availability') in ('primary', 'creative', 'confirm'), 'Service type is invalid.')
        require(isinstance(service.get('relatedProjects', []), list), 'Related projects must be a list.')

    for project in data['projects']:
        for key in ('title', 'faTitle', 'category', 'faCategory', 'color', 'ink'):
            require(isinstance(project.get(key), str), f'Project field {key} must be text.')
        for key in ('tag', 'brief', 'approach', 'deliverables'):
            validate_pair(project.get(key), f'Project {key}')
        validate_image(project.get('image', ''), f'Project {project["slug"]}')

    for article in data['articles']:
        for key in ('category', 'title', 'summary'):
            validate_pair(article.get(key), f'Article {key}')
        sections = article.get('sections')
        require(isinstance(sections, list) and len(sections) == 2, 'Article sections need English and Dari lists.')
        for language_sections in sections:
            require(isinstance(language_sections, list), 'Article sections must be lists.')
            for section in language_sections:
                validate_pair(section, 'Article section')

    for person in data['team']:
        for key in ('name', 'role', 'bio'):
            validate_pair(person.get(key), f'Team {key}')
        validate_image(person.get('portrait', ''), 'Team portrait')
    for testimonial in data['testimonials']:
        for key in ('quote', 'name', 'role'):
            validate_pair(testimonial.get(key), f'Testimonial {key}')
        require(isinstance(testimonial.get('verified', False), bool) and isinstance(testimonial.get('permission', False), bool), 'Testimonial approvals must be true or false.')


class AdminHandler(SimpleHTTPRequestHandler):
    server_version = 'NovaContentStudio/1.0'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/__admin/publish':
            return self.send_json(404, {'error': 'Unknown admin endpoint.'})
        host = self.headers.get('Host', '')
        hostname = urlsplit('http://' + host).hostname
        if hostname not in ('localhost', '127.0.0.1'):
            return self.send_json(403, {'error': 'Publishing is available only from this computer.'})
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + host:
            return self.send_json(403, {'error': 'Cross-origin publishing requests are not allowed.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            require(0 < length <= MAX_BODY, 'Publish request is empty or too large.')
            data = json.loads(self.rfile.read(length))
            validate_content(data)
            normalize_uploaded_images(data)
            original = CONTENT.read_bytes()
            temporary = CONTENT.with_suffix('.json.publish-tmp')
            temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            temporary.replace(CONTENT)
            result = subprocess.run([sys.executable, str(ROOT / 'build.py')], cwd=ROOT, capture_output=True, text=True, timeout=120)
            if result.returncode:
                CONTENT.write_bytes(original)
                subprocess.run([sys.executable, str(ROOT / 'build.py')], cwd=ROOT, capture_output=True, text=True, timeout=120)
                details = (result.stderr or result.stdout).strip()[-3000:]
                return self.send_json(500, {'error': 'The build failed. Previous content was restored.', 'details': details})
            return self.send_json(200, {'message': 'Published successfully. The website has been rebuilt.', 'build': result.stdout.strip()})
        except (ValueError, json.JSONDecodeError, OSError, subprocess.TimeoutExpired) as error:
            return self.send_json(400, {'error': str(error)})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    DIST.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', port), AdminHandler)
    print(f'Nova Content Studio: http://localhost:{port}/en/admin/')
    print('Publishing is restricted to this computer. Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopping Nova Content Studio.')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()