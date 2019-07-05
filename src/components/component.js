import {
  getMods,
  STYLES_MAP,
  UNIT_ATTRS,
  convertUnit,
  getParent,
} from '../helpers';

/**
 * @class
 * @abstract
 */
class NuComponent extends HTMLElement {
  static get nuTag() {
    return '';
  }

  static get nuRole() {
    return '';
  }

  static get nuAttrs() {
    return ['mod', 'theme'];
  }

  static get nuDefaultAttrs() {
    return {};
  }

  static get observedAttributes() {
    return this.nuAttrs.concat(this.nuAttrs);
  }

  constructor() {
    super();

    const tabIndexAttr = this.getAttribute('tabindex');

    this.nuThemeStyles = true;
    this.nuThemeProps = true;
    this.nuThemeInvert = false;
    this.nuTabIndex = tabIndexAttr != null ? Number(tabIndexAttr) : 0;
    this.nuRef = null;
  }

  connectedCallback() {
    const nuRole = this.constructor.nuRole;

    if (this.getAttribute('role') == null && nuRole) {
      this.setAttribute('role', nuRole);
    }

    this.nuMounted();

    this.nuIsMounted = true;
  }

  attributeChangedCallback(name, oldValue, value) {
    switch (name) {
      case 'mod':
        this.nuUpdateGlobalMods(value);
        break;
      case 'theme':
        this.nuUpdateTheme(value);
        break;
      default:
        if (STYLES_MAP[name]) {
          if (UNIT_ATTRS.includes(name)) {
            this.style[STYLES_MAP[name]] =
              convertUnit(value || '');
          } else {
            this.style[STYLES_MAP[name]] =
              value || '';
          }
        }
    }

    this.nuChanged(name, oldValue, value);
  }

  nuSetMod(name, bool) {
    const mod = `nu-${name}`;

    if (bool) {
      this.setAttribute(mod, '');
    } else {
      this.removeAttribute(mod);
    }
  }

  nuHasMod(name) {
    const mod = `nu-${name}`;

    return this.getAttribute(mod) != null;
  }

  nuSetAria(name, value) {
    if (typeof value === 'boolean') {
      value = value ? 'true' : 'false';
    }

    this.setAttribute(`aria-${name}`, value);
  }

  nuUpdateGlobalMods(value) {
    const mods = getMods(value);

    if (this.nuGlobalMods) {
      for (let cls of this.nuGlobalMods) {
        if (cls.startsWith('-nu-') && !mods.includes(cls)) {
          this.classList.remove(cls);
        }
      }
    }

    this.nuGlobalMods = mods;

    this.classList.add(...mods);
  }

  nuUpdateTheme(theme) {
    let color, backgroundColor, specialColor, borderColor, invert = false;

    if (theme === '') theme = 'current';

    if (theme === '!') {
      const themeParent = this.nuGetParent('[theme]');
      let parentTheme = themeParent.getAttribute('theme');

      if (!parentTheme) {
        theme = 'current';
      } else if (parentTheme.startsWith('!')) {
        if (parentTheme === '!') {
          theme = 'current';
        } else {
          theme = parentTheme.slice(1);
        }
      } else {
        theme = `!${parentTheme}`;
      }
    }

    if (theme == null) {
      color = '';
      backgroundColor = '';
      specialColor = '';
      borderColor = '';

      if (!this.nuTheme) return;
    } else {
      if (theme.startsWith('!')) {
        theme = theme.slice(1);
        invert = true;

        color = `var(--${theme}-background-color, var(--default-background-color))`;
        backgroundColor = `var(--${theme}-color, var(--default-color))`;
      } else {
        color = `var(--${theme}-color, var(--default-color))`;
        backgroundColor = `var(--${theme}-background-color, var(--default-background-color))`;
      }

      specialColor = `var(--${theme}-special-color, var(--current-color, var(--default-special-color)))`;
      borderColor = `var(--${theme}-border-color, var(--current-color, var(--default-border-color)))`;
    }

    if (this.nuThemeProps) {
      if (theme !== 'current') {
        this.style.setProperty('--current-color', color);
        this.style.setProperty('--current-background-color', backgroundColor);
        this.style.setProperty('--current-special-color', specialColor);
        this.style.setProperty('--current-border-color', borderColor);
      } else {
        this.style.setProperty('--current-color', '');
        this.style.setProperty('--current-background-color', '');
        this.style.setProperty('--current-special-color', '');
        this.style.setProperty('--current-border-color', '');
      }
    }

    if (this.nuThemeInvert) {
      [color, backgroundColor] = [backgroundColor, color];
    }

    if (this.nuThemeStyles) {
      this.style.color = color;
      this.style.backgroundColor = backgroundColor;
    }

    if (theme != null) {
      this.nuTheme = {
        name: theme,
        color,
        backgroundColor,
        specialColor,
        borderColor,
        invert
      };
      this.nuSetMod('inverted', this.nuTheme.invert);
    } else {
      delete this.nuTheme;
      this.nuSetMod('inverted', false);
    }
  }

  nuSetFocusable(bool) {
    if (bool) {
      this.setAttribute('tabindex', this.nuTabIndex);
    } else {
      this.removeAttribute('tabindex');
    }

    if (this.getAttribute('nu-focusable') != null) return;

    (this.nuRef || this).addEventListener('focus', () => {
      this.nuSetMod('focus', true);
    });

    (this.nuRef || this).addEventListener('blur', () => {
      this.nuSetMod('focus', false);
    });

    this.nuSetMod('focusable', true);
  }

  nuEmit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, detail));
  }

  nuMounted() {
  }

  nuChanged() {
  }

  nuGetParent(selector) {
    return getParent(this, selector);
  }
}

export default NuComponent;
