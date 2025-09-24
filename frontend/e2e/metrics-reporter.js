// Metrics reporter for E2E tests
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class E2eMetricsReporter {
  constructor() {
    this.metrics = [];
    this.prometheusGateway = process.env.PROMETHEUS_PUSHGATEWAY || 'http://localhost:9091';
  }

  onBegin(config, suite) {
    console.log('🚀 Starting E2E test run...');
  }

  onTestEnd(test, result) {
    const duration = result.duration / 1000; // Convert to seconds
    const status = result.status === 'passed' ? 'passed' : 'failed';

    // Record test result
    this.metrics.push({
      name: 'e2e_test_results_total',
      value: 1,
      labels: {
        test_name: test.title,
        status: status,
        duration: duration.toString()
      }
    });

    // Record test duration
    this.metrics.push({
      name: 'e2e_test_duration_seconds',
      value: duration,
      labels: {
        test_name: test.title
      },
      type: 'histogram'
    });

    console.log(`📊 Test "${test.title}": ${status} (${duration.toFixed(2)}s)`);
  }

  onEnd(result) {
    console.log(`✅ E2E test run completed: ${result.passed}/${result.passed + result.failed} tests passed`);

    // Send metrics to Prometheus Pushgateway
    this.sendMetricsToPrometheus(result);

    // Generate test summary
    this.generateTestSummary(result);
  }

  async sendMetricsToPrometheus(result) {
    if (!this.metrics.length) return;

    try {
      // Create Prometheus format metrics
      const prometheusMetrics = this.formatMetricsForPrometheus();

      // Send to Pushgateway
      const response = await fetch(`${this.prometheusGateway}/metrics/job/e2e_tests/instance/${process.env.CI ? 'ci' : 'local'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: prometheusMetrics
      });

      if (response.ok) {
        console.log('📤 E2E metrics sent to Prometheus Pushgateway');
      } else {
        console.warn('⚠️ Failed to send metrics to Pushgateway:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Error sending metrics to Pushgateway:', error.message);
    }
  }

  formatMetricsForPrometheus() {
    const lines = [];

    // Group metrics by name
    const metricsByName = {};
    this.metrics.forEach(metric => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric);
    });

    // Format each metric group
    Object.entries(metricsByName).forEach(([name, metrics]) => {
      metrics.forEach(metric => {
        const labels = metric.labels ? Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',') : '';

        if (metric.type === 'histogram') {
          // For histograms, create bucket and count metrics
          const bucketValue = metric.value;
          lines.push(`# TYPE ${name} histogram`);
          lines.push(`${name}_bucket{le="${bucketValue}"} 1`);
          lines.push(`${name}_bucket{le="+Inf"} 1`);
          lines.push(`${name}_count 1`);
          lines.push(`${name}_sum ${bucketValue}`);
        } else {
          lines.push(`# TYPE ${name} counter`);
          lines.push(`${name}${labels ? `{${labels}}` : ''} ${metric.value}`);
        }
      });
    });

    return lines.join('\n');
  }

  generateTestSummary(result) {
    const summary = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      totalTests: result.passed + result.failed,
      passedTests: result.passed,
      failedTests: result.failed,
      passRate: ((result.passed / (result.passed + result.failed)) * 100).toFixed(2),
      duration: result.duration,
      commit: this.getCurrentCommit(),
      branch: this.getCurrentBranch()
    };

    // Save summary to file
    const summaryPath = path.join(process.cwd(), 'test-results', 'e2e-summary.json');
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('📋 E2E test summary saved:', summaryPath);
    console.log('📊 Pass rate:', summary.passRate + '%');
  }

  getCurrentCommit() {
    try {
      return execSync('git rev-parse HEAD').toString().trim();
    } catch {
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch {
      return 'unknown';
    }
  }
}

module.exports = E2eMetricsReporter;