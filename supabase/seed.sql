-- ==============================================================================
-- Development Seed Data (DO NOT RUN IN PRODUCTION)
-- ==============================================================================

INSERT INTO public.links (slug, destination_url, title, description, is_active, click_count)
VALUES
    (
        'submission',
        'https://example.com/gdg-crce-submission-form-demo',
        'BitNBuild Project Submission (Demo)',
        'Development placeholder for annual hackathon project submissions.',
        true,
        142
    ),
    (
        'register',
        'https://example.com/gdg-crce-event-registration-demo',
        'Upcoming Workshop Registration (Demo)',
        'Development placeholder for workshop event RSVP.',
        true,
        89
    ),
    (
        'discord',
        'https://example.com/gdg-crce-discord-invite-demo',
        'GDG CRCE Discord Server (Demo)',
        'Development placeholder for official student developer Discord.',
        true,
        310
    ),
    (
        'instagram',
        'https://example.com/gdg-crce-instagram-demo',
        'GDG CRCE Instagram (Demo)',
        'Development placeholder for Instagram community handle.',
        true,
        205
    ),
    (
        'website',
        'https://example.com/gdg-crce-official-demo',
        'GDG CRCE Chapter Website (Demo)',
        'Development placeholder for chapter website.',
        true,
        521
    ),
    (
        'bitnbuild',
        'https://example.com/gdg-crce-bitnbuild-demo',
        'BitNBuild Hackathon Portal (Demo)',
        'Development placeholder for national hackathon landing page.',
        true,
        890
    )
ON CONFLICT (LOWER(slug)) DO NOTHING;
