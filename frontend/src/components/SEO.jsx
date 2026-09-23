import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url,
  type = 'website',
  language = 'id'
}) => {
  const siteTitle = 'KAN - Komite Akreditasi Nasional';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = language === 'id' 
    ? 'Komite Akreditasi Nasional (KAN) adalah lembaga akreditasi yang diakui secara internasional, memberikan jaminan kompetensi untuk lembaga penilaian kesesuaian di Indonesia.'
    : 'National Accreditation Committee (KAN) is an internationally recognized accreditation body, providing competence assurance for conformity assessment bodies in Indonesia.';
  const defaultKeywords = language === 'id'
    ? 'KAN, akreditasi, Indonesia, komite akreditasi nasional, ISO, laboratorium, sertifikasi, inspeksi'
    : 'KAN, accreditation, Indonesia, national accreditation committee, ISO, laboratory, certification, inspection';
  const defaultImage = '/images/kan-og-image.jpg';
  const siteUrl = 'https://kan.go.id';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="author" content="Komite Akreditasi Nasional (KAN)" />
      <link rel="canonical" href={url || siteUrl} />
      
      {/* Language */}
      <html lang={language} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={language === 'id' ? 'id_ID' : 'en_US'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url || siteUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#1e40af" />
      <meta name="msapplication-TileColor" content="#1e40af" />
    </Helmet>
  );
};

export default SEO;
