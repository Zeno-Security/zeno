<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Client Integration

## Installation

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/zeno-security/zeno@latest/dist/client/zeno.min.js"></script>
```

## Usage

### Attributes

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `zeno-site-key` | UUID for multi-site config | **Required** |
| `zeno-api-endpoint` | URL of your Worker | **Required** |
| `zeno-floating` | Enable Floating Mode (boolean) | `false` |
| `zeno-theme` | `light` or `dark` | `light` |
| `data-zeno-hidden-field-name` | Name of hidden input for forms | `zeno-token` |

### Internationalization (i18n)

Customize the text labels by adding these attributes:

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `zeno-i18n-verifying-label` | Text shown while solving | "Verifying..." |
| `zeno-i18n-error-label` | Text shown on failure | "Error" |
| `zeno-i18n-solved-label` | Text shown on success | "Success!" |
| `zeno-i18n-human-label` | Text for 'I am human' checkbox | "I am human" |

**Example:**
```html
<zeno-widget
    zeno-site-key="..."
    zeno-api-endpoint="..."
    zeno-i18n-verifying-label="Vérification..."
    zeno-i18n-error-label="Erreur!"
    zeno-i18n-solved-label="Vérifié"
></zeno-widget>
```

### Event Handling

```javascript
const widget = document.querySelector('zeno-widget');

// Success
widget.addEventListener('solve', (e) => {
    console.log('Token:', e.detail.token);
});

// Error
widget.addEventListener('error', (e) => {
    console.error(e.detail.message);
});
```
