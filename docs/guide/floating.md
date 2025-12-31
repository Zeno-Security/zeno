<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Floating Mode

**Zeno Floating Mode** places the widget in a fixed position on your screen.

## Attributes

Enable it via `zeno-floating`. All standard and i18n attributes work here too.

```html
<zeno-widget
    zeno-site-key="YOUR_KEY"
    zeno-api-endpoint="..."
    zeno-floating
    zeno-i18n-verifying-label="Verifying..."
    zeno-i18n-solved-label="Verified"
></zeno-widget>
```

## Positioning

The widget automatically attaches to the bottom-right. To customize:

```css
zeno-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
}
```

## Global Trigger

You can also control it via a trigger button:

```html
<button zeno-floating="#my-widget">Show CAPTCHA</button>
<zeno-widget id="my-widget" ... zeno-floating style="display:none"></zeno-widget>
```