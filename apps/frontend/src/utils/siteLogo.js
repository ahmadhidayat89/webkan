const SITE_LOGO_STORAGE_KEY = 'kan_logo';
export const SITE_LOGO_UPDATED_EVENT = 'kan:logo-updated';

export const getStoredSiteLogo = () => {
  try {
    return JSON.parse(localStorage.getItem(SITE_LOGO_STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

export const setStoredSiteLogo = (value) => {
  if (value) {
    localStorage.setItem(SITE_LOGO_STORAGE_KEY, JSON.stringify(value));
  } else {
    localStorage.removeItem(SITE_LOGO_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(SITE_LOGO_UPDATED_EVENT, { detail: value || null }));
};
