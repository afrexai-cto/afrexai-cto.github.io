'use strict';

/**
 * Data source connector registry.
 * Supports: csv (local files), google (stub), quickbooks (stub), salesforce (stub)
 */

const csv = require('./csv');
const path = require('path');
const db = require('../db');

const connectors = {
  csv: {
    name: 'CSV File',
    fetch(config, demoDir) {
      const filePath = path.resolve(demoDir, config.path);
      return csv.parseCSV(filePath);
    },
    query(config, demoDir, opts) {
      const filePath = path.resolve(demoDir, config.path);
      return csv.query(filePath, opts);
    },
    meta(config, demoDir) {
      const filePath = path.resolve(demoDir, config.path);
      return { headers: csv.getHeaders(filePath), rows: csv.rowCount(filePath) };
    },
  },

  upload: {
    name: 'Uploaded CSV',
    fetch(config) {
      return csv.parseCSV(config.uploadPath);
    },
    query(config, _demoDir, opts) {
      return csv.query(config.uploadPath, opts);
    },
    meta(config) {
      return { headers: csv.getHeaders(config.uploadPath), rows: csv.rowCount(config.uploadPath) };
    },
  },

  google_workspace: {
    name: 'Google Workspace',
    fetch(config) {
      // Stub — returns structured placeholder indicating where real OAuth + API calls would go
      return {
        _stub: true,
        provider: 'google_workspace',
        scopes: config.scopes || ['gmail.readonly', 'calendar.readonly', 'drive.readonly'],
        message: 'Google Workspace connector requires OAuth2 setup. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in 1Password.',
        endpoints: {
          gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
          calendar: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          drive: 'https://www.googleapis.com/drive/v3/files',
        },
      };
    },
  },

  quickbooks: {
    name: 'QuickBooks',
    fetch(config) {
      return {
        _stub: true,
        provider: 'quickbooks',
        message: 'QuickBooks connector requires OAuth2 setup. Configure QB_CLIENT_ID and QB_CLIENT_SECRET.',
        endpoints: {
          invoices: '/v3/company/{realmId}/query?query=select * from Invoice',
          customers: '/v3/company/{realmId}/query?query=select * from Customer',
          accounts: '/v3/company/{realmId}/query?query=select * from Account',
        },
      };
    },
  },

  salesforce: {
    name: 'Salesforce',
    fetch(config) {
      return {
        _stub: true,
        provider: 'salesforce',
        message: 'Salesforce connector requires OAuth2 setup. Configure SF_CLIENT_ID, SF_CLIENT_SECRET, SF_INSTANCE_URL.',
        endpoints: {
          contacts: '/services/data/v58.0/sobjects/Contact',
          accounts: '/services/data/v58.0/sobjects/Account',
          opportunities: '/services/data/v58.0/sobjects/Opportunity',
        },
      };
    },
  },
};

/**
 * Fetch data from a registered data source
 */
function fetchData(companyId, sourceId) {
  const data = db.read();
  const sources = data.dataSources?.[companyId] || [];
  const source = sources.find(s => s.id === sourceId);
  if (!source) throw new Error(`Data source ${sourceId} not found for ${companyId}`);

  const connector = connectors[source.type];
  if (!connector) throw new Error(`Unknown connector type: ${source.type}`);

  return connector.fetch(source.config, db.getDemoDir());
}

function queryData(companyId, sourceId, opts) {
  const data = db.read();
  const sources = data.dataSources?.[companyId] || [];
  const source = sources.find(s => s.id === sourceId);
  if (!source) throw new Error(`Data source ${sourceId} not found for ${companyId}`);

  const connector = connectors[source.type];
  if (!connector?.query) throw new Error(`Connector ${source.type} does not support query`);

  return connector.query(source.config, db.getDemoDir(), opts);
}

function listConnectorTypes() {
  return Object.entries(connectors).map(([id, c]) => ({ id, name: c.name, stub: !c.query }));
}

module.exports = { connectors, fetchData, queryData, listConnectorTypes };
