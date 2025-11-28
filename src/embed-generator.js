// SmartBlock embed code generator
class EmbedGenerator {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  generateEmbedCode(block) {
    const { id, title, layout, ctaText, productsList, customCSS, customJS } = block;
    
    const embedCode = `
<!-- Kota SmartBlock: ${title} -->
<div id="kota-block-${id}" class="kota-smartblock kota-${layout}">
  <div class="kota-block-header">
    <h3 class="kota-block-title">${title}</h3>
  </div>
  <div class="kota-products-container">
    ${this.generateProductHTML(productsList, layout, ctaText)}
  </div>
</div>

<style>
  .kota-smartblock {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    margin: 20px 0;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .kota-block-header {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    padding: 16px 20px;
  }
  
  .kota-block-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .kota-products-container {
    padding: 20px;
  }
  
  .kota-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .kota-carousel {
    display: flex;
    overflow-x: auto;
    gap: 20px;
    padding: 10px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .kota-carousel::-webkit-scrollbar {
    display: none;
  }
  
  .kota-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .kota-product {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    background: white;
  }
  
  .kota-product:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .kota-product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: #f9fafb;
  }
  
  .kota-product-info {
    padding: 16px;
  }
  
  .kota-product-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #1f2937;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .kota-product-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #3b82f6;
    margin: 0 0 12px 0;
  }
  
  .kota-product-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .kota-product-rating .stars {
    color: #fbbf24;
  }
  
  .kota-cta-button {
    width: 100%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
  }
  
  .kota-cta-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  .kota-product-retailer {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 8px;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .kota-grid {
      grid-template-columns: 1fr;
    }
    
    .kota-carousel {
      flex-direction: column;
    }
    
    .kota-product {
      min-width: 280px;
    }
  }
  
  ${customCSS || ''}
</style>

<script>
  (function() {
    const blockId = '${id}';
    const userId = '${block.userId}';
    
    // Track block view
    if (typeof fetch !== 'undefined') {
      fetch('${this.baseUrl}/api/analytics/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blockId: blockId,
          userId: userId,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}); // Silent fail for analytics
    }
    
    // Add click tracking to all CTA buttons
    document.addEventListener('DOMContentLoaded', function() {
      const ctaButtons = document.querySelectorAll('#kota-block-' + blockId + ' .kota-cta-button');
      
      ctaButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          
          const productId = this.getAttribute('data-product-id');
          const retailer = this.getAttribute('data-retailer');
          
          if (productId && retailer) {
            // Track click
            if (typeof fetch !== 'undefined') {
              fetch('${this.baseUrl}/api/analytics/track-click', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  blockId: blockId,
                  productId: productId,
                  userId: userId,
                  retailer: retailer,
                  timestamp: new Date().toISOString()
                })
              }).catch(() => {}); // Silent fail for analytics
            }
            
            // Redirect to affiliate URL
            const redirectUrl = '${this.baseUrl}/r/' + userId + '/' + blockId + '/' + productId + '?retailer=' + retailer;
            window.open(redirectUrl, '_blank');
          }
        });
      });
    });
    
    ${customJS || ''}
  })();
</script>
<!-- End Kota SmartBlock -->
    `.trim();

    return embedCode;
  }

  generateProductHTML(products, layout, ctaText) {
    const containerClass = this.getContainerClass(layout);
    
    return `
    <div class="${containerClass}">
      ${products.map(product => this.generateSingleProductHTML(product, ctaText)).join('')}
    </div>
    `;
  }

  generateSingleProductHTML(product, ctaText) {
    const { id, title, image, price, rating, reviews, retailer } = product;
    
    return `
    <div class="kota-product">
      <img src="${image}" alt="${title}" class="kota-product-image" loading="lazy">
      <div class="kota-product-info">
        <h4 class="kota-product-title">${title}</h4>
        <div class="kota-product-price">$${price}</div>
        ${rating ? `
        <div class="kota-product-rating">
          <span class="stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
          <span>${rating}/5 (${reviews || 0} reviews)</span>
        </div>
        ` : ''}
        <a href="#" class="kota-cta-button" data-product-id="${id}" data-retailer="${retailer}">
          ${ctaText || 'Buy Now'}
        </a>
        <div class="kota-product-retailer">via ${retailer}</div>
      </div>
    </div>
    `;
  }

  getContainerClass(layout) {
    switch (layout) {
      case 'grid':
        return 'kota-grid';
      case 'carousel':
        return 'kota-carousel';
      case 'list':
        return 'kota-list';
      default:
        return 'kota-grid';
    }
  }

  generateWordPressShortcode(block) {
    return `[kota_block id="${block.id}"]`;
  }

  generateWordPressPluginCode(block) {
    return `
<?php
// Kota SmartBlock WordPress Plugin
add_shortcode('kota_block', 'kota_render_block');

function kota_render_block($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
    ), $atts);
    
    if (empty($atts['id'])) {
        return '<!-- Kota Block ID required -->';
    }
    
    // Fetch block data from Kota API
    $block_data = wp_remote_get('${this.baseUrl}/api/embed/' . $atts['id']);
    
    if (is_wp_error($block_data)) {
        return '<!-- Kota Block not found -->';
    }
    
    $block = json_decode(wp_remote_retrieve_body($block_data), true);
    
    if (!$block || $block['status'] !== 'active') {
        return '<!-- Kota Block is not active -->';
    }
    
    return $block['embedCode'];
}

// Enqueue Kota styles
add_action('wp_enqueue_scripts', 'kota_enqueue_styles');

function kota_enqueue_styles() {
    wp_enqueue_style('kota-blocks', '${this.baseUrl}/css/kota-blocks.css');
}
?>
    `.trim();
  }

  generateUniversalSnippet() {
    return `
<!-- Kota Universal Embed Snippet -->
<script>
  (function() {
    const kotaScript = document.createElement('script');
    kotaScript.src = '${this.baseUrl}/js/kota-embed.js';
    kotaScript.async = true;
    document.head.appendChild(kotaScript);
  })();
</script>
<!-- End Kota Universal Embed Snippet -->
    `.trim();
  }

  generatePreviewHTML(block) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kota Block Preview: ${block.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f9fafb;
        }
        .preview-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .preview-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .preview-title {
            color: #1f2937;
            margin: 0 0 10px 0;
        }
        .preview-subtitle {
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1 class="preview-title">Block Preview</h1>
            <p class="preview-subtitle">${block.title} - ${block.layout} layout</p>
        </div>
        ${this.generateEmbedCode(block)}
    </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new EmbedGenerator();
