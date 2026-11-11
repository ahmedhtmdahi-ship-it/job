# Third-party code

`web/` derives from the JobSync source imported during M0 from https://github.com/Gsync/jobsync at commit `8c20325c35dbf203334a270cef5aef446f06a774`.

Copyright (c) 2024 gsync. Licensed under MIT; the original licence is preserved in `web/LICENSE`. M0 imported that source unchanged. M1 adds interface localization, saved locale preferences, RTL layouts, localization-aware presentation helpers and acceptance coverage; upstream business rules and stored status identifiers are retained.

JobSync dependencies retain their respective licences. No real user data or local environment files were imported.

M1 adds next-intl (MIT), @radix-ui/react-direction (MIT), and the locally hosted IBM Plex Sans Arabic font from Google Fonts (SIL Open Font License 1.1). The font licence is retained in web/src/app/fonts/arabic/OFL.txt.
