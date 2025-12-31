<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Widget Reference

Complete documentation for the `<zeno-widget>` Web Component.

## Attributes

### Configuration
*   `zeno-site-key` (Required): UUID.
*   `zeno-api-endpoint` (Required): Worker URL.
*   `zeno-floating` (Boolean): Enable floating mode.
*   `data-zeno-hidden-field-name`: Input name for form submission. Default: `zeno-token`.

### Internationalization (i18n)
*   `zeno-i18n-verifying-label`: Text while solving.
*   `zeno-i18n-error-label`: Text on failure.
*   `zeno-i18n-solved-label`: Text on success.
*   `zeno-i18n-human-label`: Text for "I am human".

## Methods

> Note: Methods must be accessed on the DOM element.

*   `startVerification()`: Manually trigger the solving process (useful for custom flows).
    ```javascript
    document.querySelector('zeno-widget').startVerification();
    ```

## Events

*   `solve`: Fired when a token is obtained.
    *   `event.detail.token`: The JWT/UUID token.
*   `error`: Fired on failure.
    *   `event.detail.message`: Error description.

## CSS Variables

| Variable | Description |
| :--- | :--- |
| `--zeno-background` | Background color |
| `--zeno-color` | Text color |
| `--zeno-border-color` | Border color |
| `--zeno-border-radius` | Border radius |
| `--zeno-widget-width` | Width (default 250px) |
| `--zeno-widget-height` | Height (default 50px) |
| `--zeno-font` | Font family |