---
layout: post
title:  Docker教程05:Docker安装ngninx
category: Docker
tags: docker 教程 nginx
keywords: docker 教程 实战 安装 nginx
description: Docker教程05:Docker安装ngninx
date: 2018-12-26T13:19:54+08:00

---

## 方法一,docker pull nginx(推荐)

查找 [Docker Hub](https://hub.docker.com/r/library/nginx/) 上的 nginx 镜像

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~/</span><span class="pln">nginx$ docker search nginx
NAME                      DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
nginx</span> <span class="typ">Official</span> <span class="pln">build of</span> <span class="typ">Nginx</span><span class="pun">.</span> <span class="pln"></span> <span class="lit">3260</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">jwilder</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">-</span><span class="pln">proxy</span> <span class="typ">Automated</span> <span class="pln"></span> <span class="typ">Nginx</span> <span class="pln">reverse proxy</span> <span class="kwd">for</span> <span class="pln">docker c</span><span class="pun">...</span> <span class="pln"></span> <span class="lit">674</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">richarvey</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">-</span><span class="pln">php</span><span class="pun">-</span><span class="pln">fpm</span> <span class="typ">Container</span> <span class="pln">running</span> <span class="typ">Nginx</span> <span class="pln"></span> <span class="pun">+</span> <span class="pln">PHP</span><span class="pun">-</span><span class="pln">FPM capable</span> <span class="pun">...</span> <span class="pln"></span> <span class="lit">207</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">million12</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">-</span><span class="pln">php</span> <span class="typ">Nginx</span> <span class="pln"></span> <span class="pun">+</span> <span class="pln">PHP</span><span class="pun">-</span><span class="pln">FPM</span> <span class="lit">5.5</span><span class="pun">,</span> <span class="pln"></span> <span class="lit">5.6</span><span class="pun">,</span> <span class="pln"></span> <span class="lit">7.0</span> <span class="pln"></span> <span class="pun">(</span><span class="pln">NG</span><span class="pun">),</span> <span class="pln"></span> <span class="typ">CentOS</span><span class="pun">...</span> <span class="pln"></span> <span class="lit">67</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">maxexcloo</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">-</span><span class="pln">php</span> <span class="typ">Docker</span> <span class="pln">framework container</span> <span class="kwd">with</span> <span class="pln"></span> <span class="typ">Nginx</span> <span class="pln"></span> <span class="kwd">and</span> <span class="pln"></span> <span class="pun">...</span> <span class="pln"></span> <span class="lit">57</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">webdevops</span><span class="pun">/</span><span class="pln">php</span><span class="pun">-</span><span class="pln">nginx</span> <span class="typ">Nginx</span> <span class="pln"></span> <span class="kwd">with</span> <span class="pln">PHP</span><span class="pun">-</span><span class="pln">FPM</span> <span class="lit">39</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">h3nrik</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">-</span><span class="pln">ldap         NGINX web server</span> <span class="kwd">with</span> <span class="pln">LDAP</span><span class="pun">/</span><span class="pln">AD</span><span class="pun">,</span> <span class="pln">SSL</span> <span class="kwd">and</span> <span class="pln">pro</span><span class="pun">...</span> <span class="pln"></span> <span class="lit">27</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">bitnami</span><span class="pun">/</span><span class="pln">nginx</span> <span class="typ">Bitnami</span> <span class="pln">nginx</span> <span class="typ">Docker</span> <span class="pln"></span> <span class="typ">Image</span> <span class="pln"></span> <span class="lit">19</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln">maxexcloo</span><span class="pun">/</span><span class="pln">nginx</span> <span class="typ">Docker</span> <span class="pln">framework container</span> <span class="kwd">with</span> <span class="pln"></span> <span class="typ">Nginx</span> <span class="pln">inst</span><span class="pun">...</span> <span class="pln"></span> <span class="lit">7</span> <span class="pln"></span> <span class="pun">[</span><span class="pln">OK</span><span class="pun">]</span> <span class="pln"></span> <span class="pun">...</span></pre>

这里我们拉取官方的镜像

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~/</span><span class="pln">nginx$ docker pull nginx</span></pre>

等待下载完成后,我们就可以在本地镜像列表里查到 REPOSITORY 为 nginx 的镜像.

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~/</span><span class="pln">nginx$ docker images nginx
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest</span> <span class="lit">555bbd91e13c</span> <span class="pln"></span> <span class="lit">3</span> <span class="pln">days ago</span> <span class="lit">182.8</span> <span class="pln">MB</span></pre>

### 方法二,通过 dockerfile 构建(不推荐)

**创建 dockerfile**

首先,创建目录 nginx, 用于存放后面的相关东西.

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~</span><span class="pln">$ mkdir</span> <span class="pun">-</span><span class="pln">p</span> <span class="pun">~</span><span class="str">/nginx/</span><span class="pln">www</span> <span class="pun">~</span><span class="str">/nginx/</span><span class="pln">logs</span> <span class="pun">~</span><span class="str">/nginx/</span><span class="pln">conf</span></pre>

**www**: 目录将映射为 nginx 容器配置的虚拟目录.

**logs**: 目录将映射为 nginx 容器的日志目录.

**conf**: 目录里的配置文件将映射为 nginx 容器的配置文件.

进入创建的 nginx 目录,创建 dockerfile 文件,内容如下：

<pre class="prettyprint prettyprinted" style=""><span class="pln">FROM debian</span><span class="pun">:</span><span class="pln">stretch</span><span class="pun">-</span><span class="pln">slim

LABEL maintainer</span><span class="pun">=</span><span class="str">"NGINX Docker Maintainers <docker-maint@nginx.com>"</span> <span class="pln">ENV NGINX_VERSION</span> <span class="lit">1.14</span><span class="pun">.</span><span class="lit">0</span><span class="pun">-</span><span class="lit">1</span><span class="pun">~</span><span class="pln">stretch
ENV NJS_VERSION</span> <span class="lit">1.14</span><span class="pun">.</span><span class="lit">0.0</span><span class="pun">.</span><span class="lit">2.0</span><span class="pun">-</span><span class="lit">1</span><span class="pun">~</span><span class="pln">stretch

RUN</span> <span class="kwd">set</span> <span class="pln"></span> <span class="pun">-</span><span class="pln">x \
    </span><span class="pun">&&</span> <span class="pln">apt</span><span class="pun">-</span><span class="kwd">get</span> <span class="pln">update \</span><span class="pun">&&</span> <span class="pln">apt</span><span class="pun">-</span><span class="kwd">get</span> <span class="pln">install</span> <span class="pun">--</span><span class="kwd">no</span><span class="pun">-</span><span class="pln">install</span><span class="pun">-</span><span class="pln">recommends</span> <span class="pun">--</span><span class="kwd">no</span><span class="pun">-</span><span class="pln">install</span><span class="pun">-</span><span class="pln">suggests</span> <span class="pun">-</span><span class="pln">y gnupg1 apt</span><span class="pun">-</span><span class="pln">transport</span><span class="pun">-</span><span class="pln">https ca</span><span class="pun">-</span><span class="pln">certificates \
    </span><span class="pun">&&</span> <span class="pln">\
    NGINX_GPGKEY</span><span class="pun">=</span><span class="lit">573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62</span><span class="pun">;</span> <span class="pln">\
    found</span><span class="pun">=</span><span class="str">''</span><span class="pun">;</span> <span class="pln">\</span><span class="kwd">for</span> <span class="pln">server</span> <span class="kwd">in</span> <span class="pln">\
        ha</span><span class="pun">.</span><span class="pln">pool</span><span class="pun">.</span><span class="pln">sks</span><span class="pun">-</span><span class="pln">keyservers</span><span class="pun">.</span><span class="pln">net \
        hkp</span><span class="pun">:</span><span class="com">//keyserver.ubuntu.com:80 \</span> <span class="pln">hkp</span><span class="pun">:</span><span class="com">//p80.pool.sks-keyservers.net:80 \</span> <span class="pln">pgp</span><span class="pun">.</span><span class="pln">mit</span><span class="pun">.</span><span class="pln">edu \
    </span><span class="pun">;</span> <span class="pln"></span> <span class="kwd">do</span> <span class="pln">\
        echo</span> <span class="str">"Fetching GPG key $NGINX_GPGKEY from $server"</span><span class="pun">;</span> <span class="pln">\
        apt</span><span class="pun">-</span><span class="pln">key adv</span> <span class="pun">--</span><span class="pln">keyserver</span> <span class="str">"$server"</span> <span class="pln"></span> <span class="pun">--</span><span class="pln">keyserver</span><span class="pun">-</span><span class="pln">options timeout</span><span class="pun">=</span><span class="lit">10</span> <span class="pln"></span> <span class="pun">--</span><span class="pln">recv</span><span class="pun">-</span><span class="pln">keys</span> <span class="str">"$NGINX_GPGKEY"</span> <span class="pln"></span> <span class="pun">&&</span> <span class="pln">found</span><span class="pun">=</span><span class="pln">yes</span> <span class="pun">&&</span> <span class="pln"></span> <span class="kwd">break</span><span class="pun">;</span> <span class="pln">\</span><span class="kwd">done</span><span class="pun">;</span> <span class="pln">\
    test</span> <span class="pun">-</span><span class="pln">z</span> <span class="str">"$found"</span> <span class="pln"></span> <span class="pun">&&</span> <span class="pln">echo</span> <span class="pun">>&</span><span class="lit">2</span> <span class="pln"></span> <span class="str">"error: failed to fetch GPG key $NGINX_GPGKEY"</span> <span class="pln"></span> <span class="pun">&&</span> <span class="pln"></span> <span class="kwd">exit</span> <span class="pln"></span> <span class="lit">1</span><span class="pun">;</span> <span class="pln">\
    apt</span><span class="pun">-</span><span class="kwd">get</span> <span class="pln">remove</span> <span class="pun">--</span><span class="pln">purge</span> <span class="pun">--</span><span class="kwd">auto</span><span class="pun">-</span><span class="pln">remove</span> <span class="pun">-</span><span class="pln">y gnupg1</span> <span class="pun">&&</span> <span class="pln">rm</span> <span class="pun">-</span><span class="pln">rf</span> <span class="pun">/</span><span class="kwd">var</span><span class="pun">/</span><span class="pln">lib</span><span class="pun">/</span><span class="pln">apt</span><span class="pun">/</span><span class="pln">lists</span><span class="com">/* \
    && dpkgArch="$(dpkg --print-architecture)" \
    && nginxPackages=" \
        nginx=${NGINX_VERSION} \
        nginx-module-xslt=${NGINX_VERSION} \
        nginx-module-geoip=${NGINX_VERSION} \
        nginx-module-image-filter=${NGINX_VERSION} \
        nginx-module-njs=${NJS_VERSION} \
    " \
    && case "$dpkgArch" in \
        amd64|i386) \
# arches officialy built by upstream
            echo "deb https://nginx.org/packages/debian/ stretch nginx" >> /etc/apt/sources.list.d/nginx.list \
            && apt-get update \
            ;; \
        *) \
# we're on an architecture upstream doesn't officially build for
# let's build binaries from the published source packages
            echo "deb-src https://nginx.org/packages/debian/ stretch nginx" >> /etc/apt/sources.list.d/nginx.list \
            \
# new directory for storing sources and .deb files
            && tempDir="$(mktemp -d)" \
            && chmod 777 "$tempDir" \
# (777 to ensure APT's "_apt" user can access it too)
            \
# save list of currently-installed packages so build dependencies can be cleanly removed later
            && savedAptMark="$(apt-mark showmanual)" \
            \
# build .deb files from upstream's source packages (which are verified by apt-get)
            && apt-get update \
            && apt-get build-dep -y $nginxPackages \
            && ( \
                cd "$tempDir" \
                && DEB_BUILD_OPTIONS="nocheck parallel=$(nproc)" \
                    apt-get source --compile $nginxPackages \
            ) \
# we don't remove APT lists here because they get re-downloaded and removed later
            \
# reset apt-mark's "manual" list so that "purge --auto-remove" will remove all build dependencies
# (which is done after we install the built packages so we don't have to redownload any overlapping dependencies)
            && apt-mark showmanual | xargs apt-mark auto > /dev/null \
            && { [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark; } \
            \
# create a temporary local APT repo to install from (so that dependency resolution can be handled by APT, as it should be)
            && ls -lAFh "$tempDir" \
            && ( cd "$tempDir" && dpkg-scanpackages . > Packages ) \
            && grep '^Package: ' "$tempDir/Packages" \
            && echo "deb [ trusted=yes ] file://$tempDir ./" > /etc/apt/sources.list.d/temp.list \
# work around the following APT issue by using "Acquire::GzipIndexes=false" (overriding "/etc/apt/apt.conf.d/docker-gzip-indexes")
#   Could not open file /var/lib/apt/lists/partial/_tmp_tmp.ODWljpQfkE_._Packages - open (13: Permission denied)
#   ...
#   E: Failed to fetch store:/var/lib/apt/lists/partial/_tmp_tmp.ODWljpQfkE_._Packages  Could not open file /var/lib/apt/lists/partial/_tmp_tmp.ODWljpQfkE_._Packages - open (13: Permission denied)
            && apt-get -o Acquire::GzipIndexes=false update \
            ;; \
    esac \
    \
    && apt-get install --no-install-recommends --no-install-suggests -y \
                        $nginxPackages \
                        gettext-base \
    && apt-get remove --purge --auto-remove -y apt-transport-https ca-certificates && rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/nginx.list \
    \
# if we have leftovers from building, let's purge them (including extra, unnecessary build deps)
    && if [ -n "$tempDir" ]; then \
        apt-get purge -y --auto-remove \
        && rm -rf "$tempDir" /etc/apt/sources.list.d/temp.list; \
    fi

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]</span></pre>

通过 dockerfile 创建一个镜像,替换成您自己的名字.

<pre class="prettyprint prettyprinted" style=""><span class="pln">docker build</span> <span class="pun">-</span><span class="pln">t nginx</span> <span class="pun">.</span></pre>

创建完成后,我们可以在本地的镜像列表里查找到刚刚创建的镜像

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~/</span><span class="pln">nginx$ docker images nginx
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest</span> <span class="lit">555bbd91e13c</span> <span class="pln"></span> <span class="lit">3</span> <span class="pln">days ago</span> <span class="lit">182.8</span> <span class="pln">MB</span></pre>

* * *

## 使用 nginx 镜像

### 运行容器

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~</span><span class="str">/nginx$ docker run -p 80:80 --name mynginx -v $PWD/</span><span class="pln">www</span><span class="pun">:</span><span class="str">/www -v $PWD/</span><span class="pln">conf</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">.</span><span class="pln">conf</span><span class="pun">:</span><span class="str">/etc/</span><span class="pln">nginx</span><span class="pun">/</span><span class="pln">nginx</span><span class="pun">.</span><span class="pln">conf</span> <span class="pun">-</span><span class="pln">v $PWD</span><span class="pun">/</span><span class="pln">logs</span><span class="pun">:/</span><span class="pln">wwwlogs</span> <span class="pun">-</span><span class="pln">d nginx</span> <span class="lit">45c89fab0bf9ad643bc7ab571f3ccd65379b844498f54a7c8a4e7ca1dc3a2c1e</span> <span class="pln">root@mojotv</span><span class="pun">:~/</span><span class="pln">nginx$</span></pre>

命令说明：

* **-p 80:80：**将容器的80端口映射到主机的80端口

* **--name mynginx：**将容器命名为mynginx

* **-v $PWD/www:/www：**将主机中当前目录下的www挂载到容器的/www

* **-v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf：**将主机中当前目录下的nginx.conf挂载到容器的/etc/nginx/nginx.conf

* **-v $PWD/logs:/wwwlogs：**将主机中当前目录下的logs挂载到容器的/wwwlogs

### 查看容器启动情况

<pre class="prettyprint prettyprinted" style=""><span class="pln">root@mojotv</span><span class="pun">:~/</span><span class="pln">nginx$ docker ps
CONTAINER ID        IMAGE        COMMAND                      PORTS                         NAMES</span> <span class="lit">45c89fab0bf9</span> <span class="pln">nginx</span> <span class="str">"nginx -g 'daemon off"</span> <span class="pln"></span> <span class="pun">...</span> <span class="pln"></span> <span class="lit">0.0</span><span class="pun">.</span><span class="lit">0.0</span><span class="pun">:</span><span class="lit">80</span><span class="pun">-></span><span class="lit">80</span><span class="pun">/</span><span class="pln">tcp</span><span class="pun">,</span> <span class="pln"></span> <span class="lit">443</span><span class="pun">/</span><span class="pln">tcp   mynginx
f2fa96138d71        tomcat</span> <span class="str">"catalina.sh run"</span> <span class="pln"></span> <span class="pun">...</span> <span class="pln"></span> <span class="lit">0.0</span><span class="pun">.</span><span class="lit">0.0</span><span class="pun">:</span><span class="lit">81</span><span class="pun">-></span><span class="lit">8080</span><span class="pun">/</span><span class="pln">tcp          tomcat</span></pre>

通过浏览器访问

![](//www.runoob.com/wp-content/uploads/2016/06/nginx.png)
