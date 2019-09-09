# tiny-reverse-proxy

It is a single command line HTTP and Websocket proxy built on top of node-http-proxy.<br/>

## Install

Install with `npm`:

```bash
npm install --save-dev --save-exact tiny-reverse-proxy
# or globally
npm install --global tiny-reverse-proxy
```

Install with `yarn`:

```bash
yarn add tiny-reverse-proxy --dev --exact
# or globally
yarn global add tiny-reverse-proxy
```

## Usage

Forward requests from 127.0.0.1:8000 to 10.0.2.2:8000

```bash
tiny-reverse-proxy --proxy=10.0.2.2,8000
```

Forward requests from 127.0.0.1:3000 to my.host:8000

```bash
tiny-reverse-proxy --proxy=my.host,8000,3000
```

Multiple proxies at the same time

```bash
tiny-reverse-proxy --proxy=10.0.2.2,8000 --proxy=my.host,8000,3000
```

You can also use the environment variable `TINY_REVERSE_PROXY` with the same options

```bash
TINY_REVERSE_PROXY="--proxy=10.0.2.2,8000 --proxy=my.host,8000,3000" tiny-reverse-proxy
```

## Limitations

It doesn't handle HTTPS requests.<br/>
It can't send a single request to multiple hosts.<br/>

Feel free to open pull requests.
