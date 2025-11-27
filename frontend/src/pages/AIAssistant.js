import React, { useState } from 'react';
import { api } from '../utils/api';
import { 
  Sparkles, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  HelpCircle,
  Copy,
  RefreshCw,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

function AIAssistant() {
  const [loading, setLoading] = useState(false);
  
  // State for Product Blurbs
  const [blurbProductName, setBlurbProductName] = useState('');
  const [blurbProductDetails, setBlurbProductDetails] = useState('');
  const [blurbTone, setBlurbTone] = useState('professional');
  const [blurbResult, setBlurbResult] = useState('');
  
  // State for Pros and Cons
  const [prosConsProductName, setProsConsProductName] = useState('');
  const [prosConsProductDetails, setProsConsProductDetails] = useState('');
  const [prosConsResult, setProsConsResult] = useState({ pros: [], cons: [] });
  
  // State for Product Alternatives
  const [alternativeProductName, setAlternativeProductName] = useState('');
  const [alternativeBudget, setAlternativeBudget] = useState('');
  const [alternativesResult, setAlternativesResult] = useState([]);
  
  // State for FAQ Builder
  const [faqProductName, setFaqProductName] = useState('');
  const [faqProductDetails, setFaqProductDetails] = useState('');
  const [faqCount, setFaqCount] = useState(5);
  const [faqResult, setFaqResult] = useState([]);

  // Generate Product Blurb
  const handleGenerateBlurb = async () => {
    if (!blurbProductName.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-blurb', {
        productName: blurbProductName,
        productDetails: blurbProductDetails,
        tone: blurbTone
      });
      setBlurbResult(response.data.blurb);
      toast.success('Product blurb generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate blurb');
    } finally {
      setLoading(false);
    }
  };

  // Generate Pros and Cons
  const handleGenerateProsCons = async () => {
    if (!prosConsProductName.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-pros-cons', {
        productName: prosConsProductName,
        productDetails: prosConsProductDetails
      });
      setProsConsResult(response.data);
      toast.success('Pros and cons generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate pros and cons');
    } finally {
      setLoading(false);
    }
  };

  // Suggest Product Alternatives
  const handleSuggestAlternatives = async () => {
    if (!alternativeProductName.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/suggest-alternatives', {
        productName: alternativeProductName,
        budget: alternativeBudget
      });
      setAlternativesResult(response.data.alternatives);
      toast.success('Alternatives suggested successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to suggest alternatives');
    } finally {
      setLoading(false);
    }
  };

  // Generate FAQ
  const handleGenerateFAQ = async () => {
    if (!faqProductName.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-faq', {
        productName: faqProductName,
        productDetails: faqProductDetails,
        count: faqCount
      });
      setFaqResult(response.data.faqs);
      toast.success('FAQ generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate FAQ');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8" />
          <h1 className="text-3xl font-bold">AI Assistant</h1>
        </div>
        <p className="text-purple-100">
          Generate product content, analyze features, and build SEO-friendly FAQs with AI
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature 1: Product Blurb Generator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold">Generate Product Blurbs</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={blurbProductName}
                onChange={(e) => setBlurbProductName(e.target.value)}
                placeholder="e.g., Wireless Earbuds Pro"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Details (Optional)
              </label>
              <textarea
                value={blurbProductDetails}
                onChange={(e) => setBlurbProductDetails(e.target.value)}
                placeholder="Add key features, specs, or details about the product..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                value={blurbTone}
                onChange={(e) => setBlurbTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="persuasive">Persuasive</option>
              </select>
            </div>

            <button
              onClick={handleGenerateBlurb}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Generate Blurb
            </button>

            {blurbResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Generated Blurb</span>
                  <button
                    onClick={() => copyToClipboard(blurbResult)}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{blurbResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Feature 2: Pros and Cons Generator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Auto-Write Pros & Cons</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={prosConsProductName}
                onChange={(e) => setProsConsProductName(e.target.value)}
                placeholder="e.g., Bluetooth Speaker"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Details (Optional)
              </label>
              <textarea
                value={prosConsProductDetails}
                onChange={(e) => setProsConsProductDetails(e.target.value)}
                placeholder="Add product features, specs, or information..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleGenerateProsCons}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Generate Pros & Cons
            </button>

            {prosConsResult.pros.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Pros</span>
                  </div>
                  <ul className="space-y-1">
                    {prosConsResult.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-green-700">• {pro}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-red-50 rounded-md border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Cons</span>
                  </div>
                  <ul className="space-y-1">
                    {prosConsResult.cons.map((con, index) => (
                      <li key={index} className="text-sm text-red-700">• {con}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => copyToClipboard(
                    `Pros:\n${prosConsResult.pros.map(p => '• ' + p).join('\n')}\n\nCons:\n${prosConsResult.cons.map(c => '• ' + c).join('\n')}`
                  )}
                  className="w-full text-green-600 hover:text-green-700 flex items-center justify-center gap-1 text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Alternatives */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Suggest Better Product Alternatives</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Product Name *
            </label>
            <input
              type="text"
              value={alternativeProductName}
              onChange={(e) => setAlternativeProductName(e.target.value)}
              placeholder="e.g., Budget Laptop"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Range (Optional)
            </label>
            <input
              type="text"
              value={alternativeBudget}
              onChange={(e) => setAlternativeBudget(e.target.value)}
              placeholder="e.g., $500-$800"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSuggestAlternatives}
          disabled={loading}
          className="w-full md:w-auto bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Suggest Alternatives
        </button>

        {alternativesResult.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alternativesResult.map((alt, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-md border border-purple-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-800">{alt.name}</span>
                  <Lightbulb className="h-5 w-5 text-purple-600 flex-shrink-0" />
                </div>
                {alt.reason && (
                  <p className="text-sm text-gray-700">{alt.reason}</p>
                )}
                {alt.priceRange && (
                  <p className="text-xs text-gray-600 mt-2">💵 {alt.priceRange}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Builder */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">AI FAQ Builder (For SEO)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={faqProductName}
              onChange={(e) => setFaqProductName(e.target.value)}
              placeholder="e.g., Smartwatch Series 5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of FAQs
            </label>
            <input
              type="number"
              value={faqCount}
              onChange={(e) => setFaqCount(parseInt(e.target.value) || 5)}
              min="3"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Details (Optional)
          </label>
          <textarea
            value={faqProductDetails}
            onChange={(e) => setFaqProductDetails(e.target.value)}
            placeholder="Add product features, specifications, or key information to generate relevant FAQs..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleGenerateFAQ}
          disabled={loading}
          className="w-full md:w-auto bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Generate FAQ
        </button>

        {faqResult.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Generated FAQs</span>
              <button
                onClick={() => copyToClipboard(
                  faqResult.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')
                )}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy All
              </button>
            </div>
            
            <div className="space-y-3">
              {faqResult.map((faq, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">Q</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-700">{faq.answer}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAssistant;

