/** URL absoluta da imagem de compartilhamento (logo original, quadrado 512). */
export const NEXUS_SHARE_IMAGE_URL = 'https://nexussystems.dev/img/nexus-share.png';

export const NEXUS_SHARE_SITE_URL = 'https://nexussystems.dev/';

export const NEXUS_SHARE_TEXT =
  'Conheça a NEXUS — tecnologia personalizada que se adapta ao seu negócio.';

async function fetchShareLogoFile(): Promise<File | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const res = await fetch('/img/nexus-share.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], 'nexus-share.png', { type: 'image/png' });
  } catch {
    return null;
  }
}

export async function shareNexusWithLogo(opts: {
  url: string;
  title: string;
  text: string;
  share?: (data: ShareData) => Promise<void>;
}): Promise<void> {
  const shareFn = opts.share ?? navigator.share?.bind(navigator);
  if (!shareFn) throw new Error('share_unavailable');

  const base: ShareData = {
    title: opts.title,
    text: opts.text,
    url: opts.url,
  };

  const logoFile = await fetchShareLogoFile();
  if (logoFile && navigator.canShare?.({ ...base, files: [logoFile] })) {
    await shareFn({ ...base, files: [logoFile] });
    return;
  }

  await shareFn(base);
}
