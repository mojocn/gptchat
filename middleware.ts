import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  //redirect to my old site map to new site map
  const uri = request.nextUrl.pathname + request.nextUrl.search;
  return NextResponse.redirect(new URL(uri, "https://zh.mojotv.cn"));
}

// See "Matching Paths" below to learn more

function oldSiteURL() {
  const oldSiteMapsTxt = `https://mojotv.cn/.netlify/functions/captcha
https://mojotv.cn/rust/rust-postgres-sql-sqlx-crud
https://mojotv.cn/misc/terraform-cicd
https://mojotv.cn/rust/rust-crate-01-quote
https://mojotv.cn/rust/rust-tencent-cloud-api-sign
https://mojotv.cn/golang/golang-terminl-util-felix
https://mojotv.cn/rust/rust-cheatsheet-01-data-structures
https://mojotv.cn/rust/rust-code-inline-not-alway-icache
https://mojotv.cn/rust/rust-code-inline
https://mojotv.cn/go/golang-2fa
https://mojotv.cn/golang/golang-html5-websocket-remote-desktop
https://mojotv.cn/tutorial/go-mod-private
https://mojotv.cn/misc/golang-ssh-git-hook-cicd
https://mojotv.cn/golang/ssh-pty-im
https://mojotv.cn/misc/golang-gin-log-handler
https://mojotv.cn/misc/stock-price
https://mojotv.cn/misc/bug-log
https://mojotv.cn/golang/golang-ssh-sudo-without-tty
https://mojotv.cn/golang/encrypt-tea-xtea-simple-efficient
https://mojotv.cn/go/go-range-download
https://mojotv.cn/go/go-unit-test-interface
https://mojotv.cn/go/golang-full-text-search-engine
https://mojotv.cn/go/report-alert-prometheus-ADL
https://mojotv.cn/go/golang-ELKB
https://mojotv.cn/go/crypto-js-with-golang
https://mojotv.cn/go/golang-channel-use-cases
https://mojotv.cn/go/accasionally-bug
https://mojotv.cn/rust/rust-notes-02-lifetime-syntax
https://mojotv.cn/rust/rust-notes-01-ownership
https://mojotv.cn/algorithm/string-bm
https://mojotv.cn/algorithm/dp-dynamic-programming
https://mojotv.cn/go/golang-crypto
https://mojotv.cn/algorithm/golang-quick-sort
https://mojotv.cn/go/golang-torrent
https://mojotv.cn/go/golang-rand-math-crypto
https://mojotv.cn/go/golang-reflect-string
https://mojotv.cn/misc/gitlab-ci-cd-runner
https://mojotv.cn/go/refactor-base64-captcha
https://mojotv.cn/go/golang-remote_debug
https://mojotv.cn/misc/kong-resource-oauth2-plugin
https://mojotv.cn/misc/kong-resource-description
https://mojotv.cn/misc/november-diary
https://mojotv.cn/misc/springboot2-experience
https://mojotv.cn/go/create-your-own-ssh-server
https://mojotv.cn/go/chromedp-example
https://mojotv.cn/go/golang-flat-app-structure
https://mojotv.cn/go/hardware-footprint-gui-proxy
https://mojotv.cn/python/selenium-chrome-driver-docker
https://mojotv.cn/cloudflare-http3-pass-present-future
https://mojotv.cn/go/prometheus-client-for-go
https://mojotv.cn/tutorial/golang-init-function
https://mojotv.cn/tutorial/golang-goroutines
https://mojotv.cn/2018/12/26/golang-find-dns-record
https://mojotv.cn/go/golang-string-to-integer
https://mojotv.cn/go/golang-io-reader-writer
https://mojotv.cn/go/golang-timezones
https://mojotv.cn/python/python-word-cloud-with-docker
https://mojotv.cn/go/golang-muteex-starvation
https://mojotv.cn/go/golang-gorm-pagination
https://mojotv.cn/docker/docker-lnmp
https://mojotv.cn/go/golang-most-efficient-string-join
https://mojotv.cn/tutorial/golang-interface-reader-writer
https://mojotv.cn/tutorial/golang-interface
https://mojotv.cn/tutorial/golang-file-path
https://mojotv.cn/go/golang-plugin-tutorial
https://mojotv.cn/go/golang-jwt-auth
https://mojotv.cn/go/bad-go-pointer-returns
https://mojotv.cn/go/golang-open-browser
https://mojotv.cn/tutorial/error-handle
https://mojotv.cn/go/goland-tips
https://mojotv.cn/go/golang-github-actions
https://mojotv.cn/tutorial/golang-make-or-new
https://mojotv.cn/tutorial/pointer
https://mojotv.cn/tutorial/struct-method
https://mojotv.cn/tutorial/array-or-slice
https://mojotv.cn/tutorial/golang-term-tty-pty-vt100
https://mojotv.cn/tutorial/how-get-setup-perfect-python-projetc
https://mojotv.cn/tutorial/golang-map
https://mojotv.cn/tutorial/golang-for-range
https://mojotv.cn/tutorial/golang-slice
https://mojotv.cn/tutorial/golang-array
https://mojotv.cn/tutorial/golang-defer
https://mojotv.cn/tutorial/golang-function
https://mojotv.cn/tutorial/golang-for-loop
https://mojotv.cn/tutorial/golang-switch
https://mojotv.cn/tutorial/golang-if-else
https://mojotv.cn/misc/games
https://mojotv.cn/tutorial/golang-package
https://mojotv.cn/tutorial/golang-data-type
https://mojotv.cn/tutorial/golang-installation
https://mojotv.cn/tutorial/golang-tutorial
https://mojotv.cn/misc/contra-30-life
https://mojotv.cn/2019/08/20/dash-graph-of-prometheus
https://mojotv.cn/2019/08/05/golang-oauth2-login
https://mojotv.cn/2019/08/03/cheat-sheet-javascript-es6
https://mojotv.cn/2019/08/02/cheat-sheet-css3
https://mojotv.cn/2019/08/02/general-git-resources
https://mojotv.cn/2019/07/31/go-http-service-best-practice
https://mojotv.cn/2019/07/30/golang-http-request
https://mojotv.cn/2019/07/30/go-install
https://mojotv.cn/2019/07/27/how-to-serve-frontend-code-with-api-in-go
https://mojotv.cn/2019/07/27/golang-mod-server
https://mojotv.cn/2019/07/26/general-shell-resources
https://mojotv.cn/2019/07/26/a-golang-context-code-review
https://mojotv.cn/2019/07/23/golang-deep-into-channel
https://mojotv.cn/2019/07/21/golang-stack-function
https://mojotv.cn/2019/07/21/golang-reflect
https://mojotv.cn/2019/07/21/golang-operator
https://mojotv.cn/2019/07/21/golang-json-parse
https://mojotv.cn/2019/07/21/golang-io-2
https://mojotv.cn/2019/07/21/golang-hot-restart
https://mojotv.cn/2019/07/21/golang-escape
https://mojotv.cn/2019/07/20/golang-vugu-webassembly
https://mojotv.cn/2019/07/20/golang-io
https://mojotv.cn/2019/07/20/golang-defer
https://mojotv.cn/2019/07/15/ldap
https://mojotv.cn/2019/07/14/goland_crack
https://mojotv.cn/2019/07/13/install-jekyll-in-windows10
https://mojotv.cn/2019/07/12/windows10-install-gcc
https://mojotv.cn/2019/07/01/felix-wslog
https://mojotv.cn/2019/06/26/golang-context
https://mojotv.cn/2019/05/28/art-of-bash
https://mojotv.cn/2019/05/27/xtermjs-go
https://mojotv.cn/2019/05/22/golang-ssh-session
https://mojotv.cn/2019/05/22/golang-felix-ginbro
https://mojotv.cn/2019/05/21/stream-trojan-virus
https://mojotv.cn/2019/04/23/setup-a-vim-go-ide
https://mojotv.cn/2019/04/04/trinity-shellcode-aes-go
https://mojotv.cn/2019/04/02/go-1.2-go-mod-tutorial
https://mojotv.cn/2019/03/28/algorithm-string-to-int
https://mojotv.cn/2019/03/28/algorithm-string-reverse
https://mojotv.cn/2019/03/28/algorithm-string-contain
https://mojotv.cn/2019/03/22/algorithm-101
https://mojotv.cn/2019/03/15/how-create-gRPC-with-TLS
https://mojotv.cn/2019/02/17/install-kali-linux-in-raspberry-pi-3b
https://mojotv.cn/2019/01/17/golang-signal-restart-deamom
https://mojotv.cn/2019/01/07/how-to-develop-an-awesome-lib-repo
https://mojotv.cn/2019/01/06/felix-slim
https://mojotv.cn/2019/01/04/intro-of-python-salt-stack
https://mojotv.cn/2019/01/03/what-is-http2
https://mojotv.cn/2019/01/02/do-we-need-web-framework-in-go
https://mojotv.cn/2018/12/27/golang-logrus-tutorial
https://mojotv.cn/2018/12/27/minio-your-own-file-storage
https://mojotv.cn/2018/12/26/create-your-own-blog
https://mojotv.cn/2018/12/26/how-to-create-docker-image
https://mojotv.cn/2018/12/26/how-to-use-docker-hub
https://mojotv.cn/2018/12/26/how-to-install-redis-in-docker
https://mojotv.cn/2018/12/26/how-install-jupyter
https://mojotv.cn/2018/12/26/socket-in-python
https://mojotv.cn/2018/12/26/python-recommend-program
https://mojotv.cn/2018/12/26/general-python-resources
https://mojotv.cn/2018/12/26/create-your-own-blog-cdn
https://mojotv.cn/2018/12/26/how-to-be-an-awesome-programmer
https://mojotv.cn/2018/12/26/laravel-mysql-bakcup-schedule
https://mojotv.cn/2018/12/26/laravel-view-log-in-browser
https://mojotv.cn/2018/12/26/learn-markdown
https://mojotv.cn/2018/12/26/php72-obfuscation
https://mojotv.cn/2018/12/26/vuejs-laravel-nginx-conf
https://mojotv.cn/2018/12/26/what-is-toml
https://mojotv.cn/2018/12/26/how-to-use-gitbook
https://mojotv.cn/2018/12/26/restful-api
https://mojotv.cn/2018/12/26/nginx-location
https://mojotv.cn/2018/12/26/nginx-cache-server
https://mojotv.cn/2018/12/26/gogs-auto-deploy
https://mojotv.cn/2018/12/26/raft-protocol
https://mojotv.cn/2018/12/26/why-raft
https://mojotv.cn/2018/12/26/seaweadfs-design-principle
https://mojotv.cn/2018/12/26/php-phantomjs-screen-shot
https://mojotv.cn/2018/12/26/general-vim-resources
https://mojotv.cn/2018/12/26/awesome-tools
https://mojotv.cn/2018/12/26/how-to-create-self-signed-and-pinned-certificates-in-go
https://mojotv.cn/2018/12/26/how-to-handle-error-in-golang-part-2
https://mojotv.cn/2018/12/26/how-to-handle-error-in-golang-part-1
https://mojotv.cn/2018/12/26/golang-gomock-unit-test
https://mojotv.cn/2018/12/26/golang-unsafe-pointer
https://mojotv.cn/2018/12/26/golang-deep-into-slice
https://mojotv.cn/2018/12/26/how-to-use-viper-configuration-in-golang
https://mojotv.cn/2018/12/26/go-link-in-golang
https://mojotv.cn/2018/12/26/what-is-context-in-go
https://mojotv.cn/2018/12/26/chromedp-tutorial-for-golang
https://mojotv.cn/2018/12/26/how-to-create-a-https-proxy-service-in-100-lines-of-code
https://mojotv.cn/2018/12/26/how-to-send-http-request
https://mojotv.cn/2018/12/26/how-to-handle-file-directory-in-go
https://mojotv.cn/2018/12/26/how-use-reflect-in-golang
https://mojotv.cn/2018/12/26/golang-lora-gui-tutorial
https://mojotv.cn/2018/12/26/golang-handle-file-directory-tutorial
https://mojotv.cn/2018/12/26/golang-hot-restart
https://mojotv.cn/2018/12/26/golang-generate
https://mojotv.cn/2018/12/26/ginbro-awesome
https://mojotv.cn/2018/12/26/golang-json-tips
https://mojotv.cn/2018/12/26/how-to-use-protobuf-rpc-in-golang
https://mojotv.cn/2018/12/26/golang-protobuf-tutorial
https://mojotv.cn/2018/12/26/golang-rpc-geo-ip
https://mojotv.cn/2018/12/26/phantomjs-tutorial-in-golang
https://mojotv.cn/2018/12/26/golang-spider-baidu-news-to-dingding
https://mojotv.cn/2018/12/26/how-to-manage-docker-image
https://mojotv.cn/2018/12/26/docker-install-nginx
https://mojotv.cn/2018/12/26/docker-use-container
https://mojotv.cn/2018/12/26/docker-command-manual
https://mojotv.cn/2018/12/26/how-to-install-docker
https://mojotv.cn/2018/12/26/what-is-docker
https://mojotv.cn/2018/12/26/shell-cheat-sheet
https://mojotv.cn/2018/12/26/golang-cheat-sheet
https://mojotv.cn/2018/12/26/python-cheat-sheet
https://mojotv.cn/2018/12/06/solve-my-coding-issues
https://mojotv.cn/2018/11/21/cpp+cheat-sheet
https://mojotv.cn/misc/tcpip-05
https://mojotv.cn/misc/tcpip-04
https://mojotv.cn/misc/tcpip-03
https://mojotv.cn/misc/tcpip-02
https://mojotv.cn/misc/tcpip-01`;

  const uris = oldSiteMapsTxt
    .split("\n")
    .map((ee) => {
      //remote https://mojotv.cn
      const part = ee.trim().replace("https://mojotv.cn/", "").split("/");
      return part;
    })
    .filter((arr) => {
      return arr.length > 1;
    })
    .map((arr) => {
      // get first two elements
      return "/" + arr.slice(0, 2).join("/");
    });
  //console.log(uris)
  return uris;
}

const uris = oldSiteURL();

export const config = {
  matcher: uris, //['/about/:path*', '/dashboard/:path*'],
};
