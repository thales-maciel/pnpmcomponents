import { getProxyAgent } from './proxy-agent';
import SocksProxyAgent from 'socks-proxy-agent'

jest.mock('agentkeepalive', () => {
  const MockHttp = mockHttpAgent('http')
  MockHttp['HttpsAgent'] = mockHttpAgent('https')
  return MockHttp
})
jest.mock('https-proxy-agent', () => mockHttpAgent('https-proxy'))

function mockHttpAgent (type: string) {
  return function Agent (opts: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return {
      ...opts,
      __type: type,
    }
  }
}

const OPTS = {
  agent: null,
  ca: 'ca',
  cert: 'cert',
  key: 'key',
  localAddress: 'localAddress',
  maxSockets: 5,
  strictSsl: true,
  timeout: 5,
}

test('all expected options passed down to proxy agent', () => {
  const opts = {
    httpsProxy: 'https://user:pass@my.proxy:1234/foo',
    noProxy: 'qar.com, bar.com',
    ...OPTS,
  }
  expect(getProxyAgent('https://foo.com/bar', opts)).toEqual({
    __type: 'https-proxy',
    auth: 'user:pass',
    ca: 'ca',
    cert: 'cert',
    host: 'my.proxy',
    key: 'key',
    localAddress: 'localAddress',
    maxSockets: 5,
    path: '/foo',
    port: '1234',
    protocol: 'https:',
    rejectUnauthorized: true,
    timeout: 6,
  })
})

test('a socks proxy', () => {
  const opts = {
    httpsProxy: 'socks://user:pass@my.proxy:1234/foo',
    ...OPTS,
  }
  const agent = getProxyAgent('https://foo.com/bar', opts)
  expect(agent instanceof SocksProxyAgent).toBeTruthy()
  expect(agent.proxy).toEqual({
    host: 'my.proxy',
    port: 1234,
    type: 5,
  })
})

test('proxy credentials are decoded', () => {
  const opts = {
    httpsProxy: 'https://use%21r:pas%2As@my.proxy:1234/foo',
    ...OPTS,
  }
  expect(getProxyAgent('https://foo.com/bar', opts)).toEqual({
    __type: 'https-proxy',
    auth: 'use!r:pas*s',
    ca: 'ca',
    cert: 'cert',
    host: 'my.proxy',
    key: 'key',
    localAddress: 'localAddress',
    maxSockets: 5,
    path: '/foo',
    port: '1234',
    protocol: 'https:',
    rejectUnauthorized: true,
    timeout: 6,
  })
})
