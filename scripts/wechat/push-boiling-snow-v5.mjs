import article from './articles/2026-02-19-boiling-snow-v5.mjs';
import { getAccessToken, uploadContentImage, uploadCoverImage, uploadDraft } from './utils.mjs';

async function push() {
  console.log(`🚀 Starting push for: ${article.meta.title}`);
  
  // 1. Get Token
  console.log('1. Getting Token...');
  const token = await getAccessToken();
  console.log('✅ Token obtained.');

  // 2. Upload Images
  console.log('2. Uploading Images...');
  
  // 2a. Upload Cover (Needs Media ID)
  console.log(`   - Uploading Cover: ${article.meta.cover_image}`);
  const thumbMediaId = await uploadCoverImage(token, article.meta.cover_image, 'cover.png');
  console.log('     ✅ Cover uploaded:', thumbMediaId);

  // 2b. Upload Content Images (Needs URL)
  const imageUrls = {};
  for (const [key, path] of Object.entries(article.localImages)) {
    console.log(`   - Uploading Content Image [${key}]: ${path}`);
    const url = await uploadContentImage(token, path, key + '.png');
    imageUrls[key] = url;
    console.log('     ✅ Uploaded:', url);
  }

  // 3. Render HTML with real URLs
  console.log('3. Rendering HTML with remote URLs...');
  const finalHtml = article.content(imageUrls);

  // 4. Create Draft payload
  const payload = {
    articles: [
      {
        title: article.meta.title,
        author: article.meta.author,
        digest: article.meta.digest,
        content: finalHtml,
        thumb_media_id: thumbMediaId
      }
    ]
  };

  // 5. Push
  console.log('4. Pushing Draft...');
  const draftId = await uploadDraft(token, payload);
  console.log('✅ Draft pushed successfully!');
  console.log('Draft ID:', draftId);
}

push().catch(console.error);
