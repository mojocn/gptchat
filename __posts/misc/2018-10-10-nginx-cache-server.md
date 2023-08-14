---
layout: post
title: Nginx设置缓存功能
category: Misc
tags: Nginx
keywords: Nginx,Cache,linux, CDN
date: 2018-12-26T13:19:54+08:00

---

Nginx ("engine x") 是一个高性能的HTTP和反向代理服务器,最早是由战斗民族的Igor Sysoev为俄罗斯访问量第二的Rambler.ru站点开发的,其功能的拓展性极强,这里介绍一下利用Nginx缓存站点html,js,image等静态资源,提升网站访问效率的方法.

当用户第一次访问页面时,由于nginx的缓存中没有,会访问upstream服务器相应的文件,第二次再访问的时候,由于已经缓存在了nginx的proxy_cache中,Nginx当接收到请求之后就不会将请求传送到upstream服务器里面了.

## Linux环境下

编辑Nginx目录下 conf/nginx.conf 配置文件,首先在配置的http域内添加缓存空间定义：

```yaml
proxy_cache_path /usr/local/nginx/cache levels=1:2 keys_zone=cache_one:500m inactive=10d max_size=10g;
proxy_temp_path /usr/local/nginx/cache/temp;
```

参数说明：

    proxy_cache_path  ——定义在文件系统中希望存储缓存的目录.如果该目录不存在,您可以用正确的权限和所有权创建它.
    proxy_temp_path  ——设置在写入proxy_temp_path时缓存临文件数据的大小,在预防一个工作进程在传递文件时阻塞太长. 
    levels  ——参数指定缓存将如何组织,Nginx将通过散列键（下方配置）的值来创建一个缓存键.我们选择了上述的levels决定了单个字符目录（这是散列值的最后一个字符）配有两个字符的子目录（下两个字符取自散列值的末尾）将被创建.您通常不必对这个细节关注,但它可以帮助Nginx快速找到相关的值.level=1:2就是把最后一位数9拿出来建一个目录,然后再把9前面的2位建一个目录,最后把刚才得到的这个缓存文件放到9/ad目录中.

同样的方法推理,如果level=1:1,那么缓存文件的路径就是/usr/local/nginx/cache/9/d/e0bd86606797639426a92306b1b98ad9
keys_zone ——参数定义缓存区域的名字,我们称之为cache_one,这个名称将在后面得配置中被引用.这也是我们定义多少元数据存储的地方.
max_size ——参数设置实际缓存数据的最大尺寸.
inactive ——在proxy_cache_path配置项中进行配置,说明某个缓存在inactive指定的时间内如果不访问,将会从缓存中删除.
随后在相应需要配置的Server域内添加如下配置：

```yaml
location ~ .*\.(js|css|gif|jpg|jpeg|png|bmp|swf|flv|html|htm)$ {
            proxy_set_header Host $host:$server_port;
            proxy_set_header   X-Real-IP   $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for; 
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_redirect default;
            proxy_cache cache_one;
            proxy_cache_valid 200 304 12h;
            proxy_cache_valid any 10m;
            proxy_cache_key $host$uri$is_args$args;
            add_header  Nginx-Cache "$upstream_cache_status";  
            expires 10d;
        }
```

主要参数说明：

    proxy_set_header  ——向upstream服务器同时发送http头,头信息中包括Host：主机,X-Real-IP：客户端真实IP地址
    proxy_cache  ——上面定义的cache_one缓存区被用于这个位置. Nginx会在这里检查传递给后端有效的条目.
    X-Proxy-Cache  ——header的额外头.我们设置这个头部为$ upstream_cache_status变量的值.这个设置头,使我们能够看到,如果请求导致高速缓存命中HIT,高速缓存未命中MISSING,或者高速缓存被明确旁路.这是对于调试特别有价值,也对客户端是有用的信息.
    proxy_cache_key  ——其会根据这个key映射成一个hash值,然后存入到本地文件中,如果您设置的proxy_cache_key为$host$uri 那么无论后面跟的什么参数,都会访问一个文件,不会再生成新的文件.
    而如果proxy_cache_key设置了$is_args$args,那么传入的参数 localhost/index.php?a=4 与localhost/index.php?a=44将映射成两个不同hash值的文件.
    proxy_cache_valid  ——配置nginx cache中的缓存文件的缓存时间,如果配置项为：proxy_cache_valid 200 304 2m;说明对于状态为200和304的缓存文件的缓存时间是2分钟,两分钟之后再访问该缓存文件时,文件会过期,从而去源服务器重新取数据.any表示其他所有

#### 完整http域：

```yaml
http {
    include       mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"' 
                      '"$upstream_cache_status"';

    access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    client_max_body_size 2000m;

    #gzip  on;

    #配置nginx缓存
    proxy_cache_path /usr/local/nginx/cache levels=1:2 keys_zone=cache_one:500m inactive=10d max_size=10g;
    proxy_temp_path /usr/local/nginx/cache/temp;

    #服务器Server代理
    server {
        listen       80;
        server_name  www.abc.org abc.org;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;

            port_in_redirect off;
            proxy_set_header Host $host:$server_port;
            proxy_set_header   X-Real-IP   $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for; 
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_redirect default;

            proxy_cache cache_one;
            proxy_cache_valid 200 304 12h;
            proxy_cache_valid any 10m;
            
            proxy_cache_key $host$uri$is_args$args;
            add_header  Nginx-Cache "$upstream_cache_status";  
            expires 10d;
        }

        location ~ .*\.(js|css|gif|jpg|jpeg|png|bmp|swf|flv|html|htm)$ {
            proxy_set_header Host $host:$server_port;
            proxy_set_header   X-Real-IP   $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for; 
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_redirect default;
            proxy_cache cache_one;
            proxy_cache_valid 200 304 12h;
            proxy_cache_valid any 10m;
            proxy_cache_key $host$uri$is_args$args;
            add_header  Nginx-Cache "$upstream_cache_status";  
            expires 10d;
        }

        #禁止缓存.action等动态页面
        location ~ .*\.(action)$ {
            proxy_set_header Host $host:$server_port;
            proxy_set_header   X-Real-IP   $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for; 
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_redirect default;
        }
    }
}
```

### Win环境下

Win环境下的设置基本相同,唯一需要注意的就是路径问题,例如缓存位置设置如下的话：

```
proxy_cache_path /nginx/cache levels=1:2 keys_zone=cache_one:500m inactive=10d max_size=10g;
proxy_temp_path /nginx/cache/temp;
```

其会将当前盘符根目录下的/nginx/cache设置为缓存区域

### 生效

重启nginx后设置即生效,在访问站点静态页面后,将在cache目录下生成相应的散列文件名的缓存文件：