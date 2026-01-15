import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PauseIcon,
  EditIcon,
  TrashIcon,
  EyeIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Blocks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: blocks, isLoading } = useQuery(
    'blocks',
    () => api.get('/blocks').then(res => res.data)
  );

  const deleteBlockMutation = useMutation(
    (blockId) => api.delete(`/blocks/${blockId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blocks');
        toast.success('Block deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete block');
      }
    }
  );

  const updateBlockStatusMutation = useMutation(
    ({ blockId, status }) => api.put(`/blocks/${blockId}`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blocks');
        toast.success('Block status updated');
      },
      onError: () => {
        toast.error('Failed to update block status');
      }
    }
  );

  const filteredBlocks = blocks?.filter(block => {
    const matchesSearch = block.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || block.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDelete = (blockId) => {
    if (window.confirm('Are you sure you want to delete this block?')) {
      deleteBlockMutation.mutate(blockId);
    }
  };

  const handleStatusToggle = (blockId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateBlockStatusMutation.mutate({ blockId, status: newStatus });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <PauseIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SmartBlock Builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose Layout: Table | Carousel | Callout | Roundup
          </p>
        </div>
        <Link
          to="/blocks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New Block
        </Link>
      </div>

      {/* SmartBlock Builder Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">SmartBlock Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Layout Options</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Table</button>
              <button className="p-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Carousel</button>
              <button className="p-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Callout</button>
              <button className="p-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Roundup</button>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Add Products</h4>
            <div className="space-y-2">
              <button className="w-full p-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-left">
                + Add Affiliate Product
              </button>
              <button className="w-full p-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-left">
                + Add Shopify Product
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h4 className="font-medium mb-2">Customize</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
              <input type="color" className="w-full h-10 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <input type="text" placeholder="Enter headline" className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input type="text" placeholder="Buy Now" className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Preview
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Generate Embed Code
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Blocks Grid */}
      {filteredBlocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlocks.map((block) => (
            <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Block Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {block.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {block.products} products • {block.retailer}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(block.status)}`}>
                      {getStatusIcon(block.status)}
                      <span className="ml-1">{block.status}</span>
                    </span>
                    <div className="relative">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block Stats */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{block.clicks || 0}</p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${block.revenue?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{block.ctr?.toFixed(1) || '0.0'}%</p>
                    <p className="text-xs text-gray-500">CTR</p>
                  </div>
                </div>
              </div>

              {/* Block Actions */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusToggle(block.id, block.status)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${
                        block.status === 'active'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {block.status === 'active' ? (
                        <>
                          <PauseIcon className="h-3 w-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                    <Link
                      to={`/blocks/${block.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      <EditIcon className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <PlusIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Get started by creating your first SmartBlock'
            }
          </p>
          <Link
            to="/blocks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create your first block
          </Link>
        </div>
      )}
    </div>
  );
}

export default Blocks;
