const http = require(`http`)
const { createProxyServer } = require(`http-proxy`)

const log = (level, message, { proxyId, req } = {}) => {
  const headers = [`[tiny-reverse-proxy]`]

  if (proxyId) {
    headers.push(`[proxy=${proxyId}]`)
  }

  if (req) {
    headers.push(`[${req.method} ${req.url}]`)
  }

  console[level](`${headers.join(``)} ${message}`)
}

function runProxy (host, port, localPort = port) {
  const proxyId = `${host},${port},${localPort}`

  const proxy = createProxyServer({
    target: { host, port }
  })

  const proxyServer = http.createServer((req, res) => {
    proxy.web(req, res)
  })

  proxyServer.on(`upgrade`, (req, socket, head) => {
    socket.on(`error`, () => {
      log(`error`, `Failed on upgrade.`, { proxyId, req })
    })

    proxy.ws(req, socket, head)
  })

  proxy.on(`error`, (err, req) => {
    log(`error`, err.message, { proxyId, req })
  })

  proxyServer.listen(localPort)

  log(
    `info`,
    `HTTP/Websocket proxy from 127.0.0.1:${localPort} to ${host}:${port}`,
    { proxyId }
  )

  return () => proxy.close(() => proxyServer.close())
}

function throwOptionError () {
  console.error(`
    Wrong usage or missing required option '--proxy'.
    
    Usage:
      tiny-reverse-proxy --proxy=10.0.2.2,8000 (from 127.0.0.1:8000 to 10.0.2.2:8000)
      tiny-reverse-proxy --proxy=my.host,8000,3000 (from 127.0.0.1:3000 to my.host:8000)
      tiny-reverse-proxy --proxy=10.0.2.2,8000 --proxy=my.host,8000,3000 (multiple proxies)
  `)
  process.exit(1)
}

exports.cli = function cli (args) {
  const options = args.length
    ? args
    : (process.env.TINY_REVERSE_PROXY || ``).split(` `)
  const { proxy: proxyOption } = require(`minimist`)(options)
  const proxyOptions = Array.isArray(proxyOption) ? proxyOption : [proxyOption]
  const proxyRunners = []

  for (const proxyOption of proxyOptions) {
    const [host, hostPort, localPort] = (proxyOption || ``).split(`,`)

    if (
      !host ||
      !Number.isInteger(Number(hostPort)) ||
      (localPort && !Number.isInteger(Number(hostPort)))
    ) {
      return throwOptionError()
    }

    proxyRunners.push(() => runProxy(host, hostPort, localPort))
  }

  const proxyCloseHandlers = []

  const onError = reason => {
    return () => {
      for (const proxyCloseHandler of proxyCloseHandlers) {
        proxyCloseHandler()
      }
      log(`error`, `All proxies get stopped. Reason: ${reason}.`)
      process.exit(0)
    }
  }

  for (const proxyRunner of proxyRunners) {
    proxyCloseHandlers.push(proxyRunner())
  }

  process.on(`uncaughtException`, onError(`Exception uncaughtException`))
  process.on(`SIGINT`, onError(`Signal SIGINT`))
  process.on(`SIGTERM`, onError(`Signal SIGTERM`))
  process.on(`SIGQUIT`, onError(`Signal SIGQUIT`))
}
