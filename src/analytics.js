// Analytics and reporting module
const store = require('./store');

class Analytics {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getAnalytics(userId, filters = {}) {
    try {
      const cacheKey = `${userId}_${JSON.stringify(filters)}`;
      const cached = this.metricsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const analyticsData = await store.getAnalyticsData(userId, filters);
      
      // Calculate additional metrics
      const metrics = this.calculateMetrics(analyticsData, filters);
      
      const result = {
        ...analyticsData,
        metrics,
        generatedAt: new Date().toISOString()
      };

      // Cache the result
      this.metricsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Analytics error:', error);
      throw new Error('Failed to get analytics data');
    }
  }

  calculateMetrics(data, filters) {
    const { clicks, blocks, totalClicks, totalRevenue, avgCTR } = data;
    
    // Time-based calculations
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentClicks = clicks.filter(click => 
      new Date(click.timestamp) >= last7Days
    );
    
    const monthlyClicks = clicks.filter(click => 
      new Date(click.timestamp) >= last30Days
    );

    // Calculate conversion rates
    const conversionRate = totalClicks > 0 ? (totalRevenue / totalClicks) * 100 : 0;
    
    // Calculate growth rates
    const previousWeekClicks = clicks.filter(click => {
      const clickDate = new Date(click.timestamp);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return clickDate >= twoWeeksAgo && clickDate < oneWeekAgo;
    }).length;

    const currentWeekClicks = recentClicks.length;
    const clickGrowthRate = previousWeekClicks > 0 ? 
      ((currentWeekClicks - previousWeekClicks) / previousWeekClicks) * 100 : 0;

    // Top performing blocks
    const topBlocks = blocks
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(block => ({
        id: block.id,
        title: block.title,
        clicks: block.clicks,
        revenue: block.revenue,
        ctr: block.ctr,
        status: block.status
      }));

    // Retailer performance
    const retailerStats = Object.entries(data.clicksByRetailer).map(([retailer, count]) => ({
      retailer,
      clicks: count,
      percentage: (count / totalClicks) * 100,
      revenue: clicks
        .filter(click => click.retailer === retailer)
        .reduce((sum, click) => sum + (click.revenue || 0), 0)
    }));

    // Daily click trends
    const dailyTrends = this.calculateDailyTrends(clicks, 30);

    // Performance alerts
    const alerts = this.generateAlerts(blocks, clicks);

    return {
      overview: {
        totalClicks,
        totalRevenue,
        avgCTR: parseFloat((avgCTR || 0).toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        clickGrowthRate: parseFloat(clickGrowthRate.toFixed(2)),
        activeBlocks: blocks.filter(b => b.status === 'active').length,
        totalBlocks: blocks.length
      },
      timeBased: {
        last7Days: {
          clicks: recentClicks.length,
          revenue: recentClicks.reduce((sum, click) => sum + (click.revenue || 0), 0)
        },
        last30Days: {
          clicks: monthlyClicks.length,
          revenue: monthlyClicks.reduce((sum, click) => sum + (click.revenue || 0), 0)
        }
      },
      topBlocks,
      retailerStats,
      dailyTrends,
      alerts
    };
  }

  calculateDailyTrends(clicks, days = 30) {
    const trends = {};
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = 0;
    }

    clicks.forEach(click => {
      const clickDate = click.timestamp.split('T')[0];
      if (trends.hasOwnProperty(clickDate)) {
        trends[clickDate]++;
      }
    });

    return Object.entries(trends).map(([date, count]) => ({
      date,
      clicks: count
    }));
  }

  generateAlerts(blocks, clicks) {
    const alerts = [];
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Low CTR alerts
    const lowCtrBlocks = blocks.filter(block => 
      block.ctr < 2 && block.clicks > 10 && block.status === 'active'
    );
    
    lowCtrBlocks.forEach(block => {
      alerts.push({
        id: `low_ctr_${block.id}`,
        type: 'warning',
        title: 'Low Converting Block',
        message: `"${block.title}" has a low CTR of ${block.ctr}%. Consider updating the product selection or CTA text.`,
        blockId: block.id,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      });
    });

    // High performing blocks
    const highCtrBlocks = blocks.filter(block => 
      block.ctr > 4 && block.clicks > 20 && block.status === 'active'
    );
    
    highCtrBlocks.forEach(block => {
      alerts.push({
        id: `high_ctr_${block.id}`,
        type: 'success',
        title: 'Top Performer',
        message: `"${block.title}" is performing exceptionally well with a ${block.ctr}% CTR!`,
        blockId: block.id,
        timestamp: new Date().toISOString(),
        priority: 'low'
      });
    });

    // Recent performance drops
    const recentClicks = clicks.filter(click => 
      new Date(click.timestamp) >= last7Days
    );
    
    if (recentClicks.length < clicks.length * 0.1) {
      alerts.push({
        id: 'performance_drop',
        type: 'warning',
        title: 'Performance Drop',
        message: 'Your click volume has decreased significantly in the last 7 days. Consider reviewing your content strategy.',
        timestamp: new Date().toISOString(),
        priority: 'high'
      });
    }

    // Inactive blocks
    const inactiveBlocks = blocks.filter(block => 
      block.status === 'draft' && 
      new Date(block.createdAt) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (inactiveBlocks.length > 0) {
      alerts.push({
        id: 'inactive_blocks',
        type: 'info',
        title: 'Inactive Blocks',
        message: `You have ${inactiveBlocks.length} draft blocks that haven't been published in over a week.`,
        timestamp: new Date().toISOString(),
        priority: 'low'
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async getAlerts(userId) {
    try {
      const blocks = await store.listBlocksByUser(userId);
      const clicks = await store.getClicksByUser(userId);
      
      return this.generateAlerts(blocks, clicks);
    } catch (error) {
      console.error('Get alerts error:', error);
      throw new Error('Failed to get alerts');
    }
  }

  async updateDailyMetrics() {
    try {
      console.log('Updating daily metrics...');
      
      // Get all users
      const users = await store.getAllUsers();
      
      for (const user of users) {
        const analytics = await this.getAnalytics(user.id, {
          dateRange: 'last30days'
        });
        
        // Store daily metrics
        const today = new Date().toISOString().split('T')[0];
        await store.updateDailyMetrics(user.id, today, {
          clicks: analytics.totalClicks,
          revenue: analytics.totalRevenue,
          blocks: analytics.metrics?.overview?.totalBlocks || analytics.totalBlocks || 0,
          avgCTR: analytics.metrics?.overview?.avgCTR || 0
        });
      }
      
      console.log('Daily metrics updated successfully');
    } catch (error) {
      console.error('Update daily metrics error:', error);
      throw error;
    }
  }

  async getRevenueProjection(userId, days = 30) {
    try {
      const analytics = await this.getAnalytics(userId, {
        dateRange: 'last30days'
      });
      
      const dailyRevenue = analytics.totalRevenue / 30;
      const projectedRevenue = dailyRevenue * days;
      
      return {
        current: analytics.totalRevenue,
        projected: projectedRevenue,
        dailyAverage: dailyRevenue,
        growthRate: analytics.metrics.overview.clickGrowthRate
      };
    } catch (error) {
      console.error('Revenue projection error:', error);
      throw new Error('Failed to calculate revenue projection');
    }
  }

  async getTopProducts(userId, limit = 10) {
    try {
      const blocks = await store.listBlocksByUser(userId);
      const clicks = await store.getClicksByUser(userId);
      
      // Aggregate product performance
      const productStats = {};
      
      blocks.forEach(block => {
        block.productsList.forEach(product => {
          const productClicks = clicks.filter(click => 
            click.productId === product.id
          ).length;
          
          if (!productStats[product.id]) {
            productStats[product.id] = {
              id: product.id,
              title: product.title,
              image: product.image,
              price: product.price,
              retailer: product.retailer,
              clicks: 0,
              revenue: 0
            };
          }
          
          productStats[product.id].clicks += productClicks;
          productStats[product.id].revenue += productClicks * (product.price * 0.05); // 5% commission estimate
        });
      });
      
      return Object.values(productStats)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, limit);
    } catch (error) {
      console.error('Get top products error:', error);
      throw new Error('Failed to get top products');
    }
  }
}

module.exports = new Analytics();
