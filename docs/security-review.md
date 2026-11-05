# WebScan follow-up — 5 November 2026

Source: the owner's transcription of https://webscan.no/rapport/s3aSJzqCAGbC4s_c0LXLhw (32/100, 18:32 Norway). This is targeted hardening, not a new full audit or a promise of a particular score.

## Scope and verified serving chain

Current `main` is the v1.0 static timeline, not the earlier interactive v0.2 site. `scripts/build.mjs` embeds one CSS block, three data-URL fonts, screenshots and a data-URL favicon in `index.html`. There are no scripts, API calls, forms, frames, external asset requests or popup communication. Public applications are ordinary outgoing links.

The Dockerfile serves committed artifacts with nginx on port 80. HTTPS and HTTP redirection occur upstream in the existing Coolify/proxy setup. No proxy configuration or infrastructure credentials are present in this repository. GitHub webhook inspection was denied by the integration (403); live deployment must be verified by public responses. No host SSH, Coolify or Traefik access was available for inspection or mutation.

Before changes, public HTTPS returned 200 without the proposed security headers. `/this-page-does-not-exist` returned 404 with `nginx/1.27.5` in its body. Both `http://ybn.no/probe?check=1` and `http://www.ybn.no/probe?check=1` returned 302 to HTTPS on the same hostname with path and query intact. Both HTTPS hostnames returned 200. The session's outbound proxy reports `Server: envoy`, so the upstream Server header cannot be independently measured through that path; the 404 body corroborates the nginx version exposure.

## Repository/container changes

`nginx/default.conf` replaces only this application's default nginx server configuration. The Dockerfile adds one COPY instruction and makes the three deployed files explicitly readable by nginx (a restrictive checkout otherwise made the local PNG return 403); port, base image, health check and deployment mechanism remain unchanged. It does not configure TLS or redirects.

`npm run build` generates the nginx configuration alongside the unchanged HTML. The CSP authorizes the SHA-256 hash of the exact inline stylesheet, including whitespace. Always commit both artifacts after style changes.

| Finding | Action |
| --- | --- |
| Missing enforced CSP | `default-src 'none'`; scripts, connections, objects, frames, forms and base URLs blocked; exact style hash; data fonts; same-origin/data images only. No unsafe-inline/eval, third-party allowlist or report-only fallback. |
| Clickjacking | CSP `frame-ancestors 'none'` and `X-Frame-Options: DENY`. Intentional: this homepage is not an embeddable application. |
| MIME sniffing | `X-Content-Type-Options: nosniff`; HTML and PNG MIME types checked. |
| Referrer | `strict-origin-when-cross-origin`. |
| Browser permissions | Deny camera, microphone, location, payment and USB; none are used. |
| HSTS | `max-age=86400` (one day), host-only. Neither includeSubDomains nor preload. Applies to each responding HTTPS hostname, not its descendants. The internal HTTP container can emit the header; browsers ignore it over plaintext. |
| nginx disclosure | `server_tokens off` removes the version from nginx headers and built-in errors. The generic product name remains; this does not patch an old nginx release. |
| COOP | `same-origin`; no popup/opener integration exists. Review if one is added. |

Headers use `always`, covering application-served 200, 304 and error responses. An upstream proxy-generated redirect/error is outside the container's control.

## Deliberately not enabled

- **COEP and restrictive CORP:** no SharedArrayBuffer or other cross-origin-isolation requirement. Isolation solely for scanner points adds no needed capability. In particular, `CORP: same-origin` on `/og.png` can restrict cross-origin consumers. Keep the public share image accessible. Reassess if a real use case appears.
- **HSTS includeSubDomains/preload:** wildcard DNS is not an inventory of working HTTPS services. Do not impose HTTPS across the entire domain or enter the preload list without that inventory. After a successful rollout, consider increasing the host-only duration to a year. To roll back, serve `max-age=0` over HTTPS; existing clients must revisit to clear it (otherwise the one-day expiry applies).
- **CSP reporting service:** no backend is necessary for this static site. Browser tests catch violations. New scripts, resources or forms require a deliberate policy review and rebuild.
- **security.txt:** optional; no verified security contact or expiry policy was supplied. Do not invent an address. `robots.txt` absence is not a security vulnerability.
- **TLS ciphers/base-image upgrade:** certificate termination is upstream. The existing nginx 1.27 base is retained to keep this change bounded; version hiding is not vulnerability remediation. Schedule a separate supported-image update with its own regression tests.

## External/operational actions

| Owner/system | Required follow-up |
| --- | --- |
| Coolify/Traefik or outer proxy | Locate the existing HTTP redirect that returns 302. Change only ybn.no/www routers to permanent 301/308 (for a Traefik redirect middleware, inspect its `permanent` setting). Verify both hostnames, arbitrary paths and querystrings; follow the chain to confirm no loops. Do not add an unconditional redirect inside this HTTP-only container. Do not change a shared middleware blindly. Check headers on proxy-generated errors separately. |
| DNS provider / certificate owners | Inventory all issuers, including wildcard and hosted services, before adding CAA. Let's Encrypt is reported for the homepage, not necessarily every service. No DNS records changed. |
| DNS provider + .no registrar | Enable zone signing and publish the corresponding verified DS through the supported provider workflow. Validate before and after; a mismatched DS can make the domain unreachable. No DNSSEC changes made. |
| Email administrator | Read real outgoing DKIM-Signature selectors and check alignment for every legitimate sender. The scanner's failure to guess a selector is not proof of missing DKIM. Review DMARC reports and the configured report mailbox before progressing from p=none to quarantine/reject. Do not tighten SPF without sender inventory. |
| MX hosting provider | Independently verify the reported NULL/EXPORT/anonymous cipher acceptance and TLS 1.0/1.1 on `mx1.no1.essentialhosting.net`; request provider remediation if confirmed. These are separate from the website's TLS. No SMTP probes or messages were sent during this change. |
| Email administrator + DNS/hosting | Plan MTA-STS and TLS-RPT only with verified MX patterns, reachable policy URL, valid HTTPS and a working reports mailbox. DANE additionally requires DNSSEC. IPv6 absence is not by itself a vulnerability. |

## Validation

- `npm run build` and `npm run check`: nine passing tests, including deterministic generation and a recomputed CSP style hash.
- Production-equivalent Docker image built; `nginx -t` succeeded.
- Chromium at 1440, 390 and 320 px against the actual container: fonts and embedded images load, no horizontal overflow, native disclosure opens with keyboard, no CSP/console errors or external requests.
- HTTP checks against the container: homepage 200 HTML, `/og.png` 200 PNG, missing page 404 HTML; configured headers present and no nginx version in error body or Server header.
- Negative browser test: an unapproved injected script does not execute and an injected inline style is blocked.
- The managed authoring environment injects an outbound proxy into test containers. The first health check hit that proxy instead of loopback; local-only test containers were recreated without those injected HTTP proxy variables. Production health-check command remains unchanged. Raw HTTP checks verify HSTS; Chromium does not expose it on the local plaintext navigation.
- No score is claimed without a fresh WebScan. After deployment, recheck the public HTTPS responses for both hostnames, the image and a 404. The final task report records the observed rollout outcome.
