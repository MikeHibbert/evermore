import Helmet from 'react-helmet';
import React from 'react';
import NFTs from './NFTs';

const Seo = ({ nft, meta, image, title, description, id, keywords }) => {
  const metaDescription = description || "Evermore - Your files stored on the blockchain forever!";
  const url = id
    ? `https://evermoredata.store/#/nft-detail/${id}`
    : `https://evermoredata.store/#/`;
  const metaImage = image ? "https://arweave.net/c1mNDCo3Mh1PdimUr5OEYyVdbgOowXV2Ct_JN5irnRE" : null;

  const metadata = meta || {};

  return (
    <Helmet
      htmlAttributes={{ lang: 'en' }}
      {...(title
        ? {
            titleTemplate: `%s - evermoredata.store`,
            title,
          }
        : {
            title: "Evermore - Your files stored on the blockchain forever!",
          })}
      meta={[
        {
          name: 'google-site-verification',
          content: 'rdHghgE19nXaz19_OXvkv_MuEOSHl8lQPesWUmp21oU',
        },
        {
          name: 'description',
          content: metaDescription,
        },
        {
          name: 'keywords',
          content: keywords ? keywords.join() : 'metaDescription',
        },
        {
          property: 'og:url',
          content: url,
        },
        {
          property: 'og:title',
          content: title || "Evermore - Your files stored on the blockchain forever!",
        },
        {
          name: 'og:description',
          content: metaDescription,
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: title || "Evermore - Your files stored on the blockchain forever!",
        },
        {
          name: 'twitter:description',
          content: metaDescription,
        },
        ,
        {
          name: 'twitter:site',
          content: "https://evermoredata.store",
        }
      ]
        .concat(
          metaImage
            ? [
                { property: 'og:image', content: metaImage },
                { name: 'twitter:image', content: metaImage },
              ]
            : []
        )
        .concat(metadata)}
      link={[
        {
          rel: 'canonical',
          href: url,
        }
      ]}
    />
  );
};

export default Seo;