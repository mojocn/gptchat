---
layout: post
title: laravel完美解决(消灭)跨域问题
category: Misc
tags: lumen nginx laravel cors
date: 2018-12-26T13:19:54+08:00
keywords: laravel|lumen完美解决(消灭)跨域问题,跨域资源共享(CORS) 是一种机制,它使用额外的 HTTP 头来告诉浏览器  让运行在一个 origin (domain) 上的Web应用被准许访问来自不同源服务器上的指定的资源.
---

## 疼点

> 跨域资源共享(CORS) 是一种机制,它使用额外的 HTTP 头来告诉浏览器 让运行在一个 origin (domain) 上的Web应用被准许访问来自不同源服务器上的指定的资源.
> 当一个资源从与该资源本身所在的服务器不同的域或端口请求一个资源时,资源会发起一个跨域 HTTP 请求.
> 比如,站点 http://domain-a.com 的某 HTML 页面通过 <img> 的 src 请求 http://domain-b.com/image.jpg.
> 网络上的许多页面都会加载来自不同域的CSS样式表,图像和脚本等资源.
> 出于安全原因,浏览器限制从脚本内发起的跨源HTTP请求.
> 例如,XMLHttpRequest和Fetch API遵循同源策略. 这意味着使用这些API的Web应用程序只能从加载应用程序的同一个域请求HTTP资源,除非使用CORS头文件.

## 解决方案

### laravel使用跨域中间件

先检查app/Http/Middleware/ 下是否有EnableCrossRequestMiddleware.php 这个文件,没有此文件使用此命令创建
`php artisan make:middleware EnableCrossRequestMiddleware`
然后修改`EnableCrossRequestMiddleware.php` 的handle

```php
     /**
 * Handle an incoming request.
 *
 * @param  \Illuminate\Http\Request  $request
 * @param  \Closure  $next
 * @return mixed
 */
public function handle($request, Closure $next)
{
    $response = $next($request);
    $origin = $request->server('HTTP_ORIGIN') ? $request->server('HTTP_ORIGIN') : '';
    $allow_origin = [
        'http://127.0.0.1:8080',//允许访问
    ];
    if (in_array($origin, $allow_origin)) {
        $response->header('Access-Control-Allow-Origin', $origin);
        $response->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Cookie, X-CSRF-TOKEN, Accept, Authorization, X-XSRF-TOKEN');
        $response->header('Access-Control-Expose-Headers', 'Authorization, authenticated');
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, OPTIONS');
        $response->header('Access-Control-Allow-Credentials', 'true');
    }
    return $response;
}
```

然后找到`app/Http/Kernel.php`文件中的 `protected $middleware`

```php
    protected $middleware = [
    \App\Http\Middleware\CheckForMaintenanceMode::class,
    \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
    \App\Http\Middleware\TrimStrings::class,
    \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    \App\Http\Middleware\TrustProxies::class,
    \App\Http\Middleware\EnableCrossRequestMiddleware::class,//新增跨域中间件
];
```

#### 优点

- php代码控制,修改方便
- 中间件使很好的设计模式
- 可以控制好跨域的来源,控制粒度更高

#### 缺点

- 执行速度不快

### nginx配置支持跨域header

nginx配置`dev.projec.com.conf`

```yaml
server {
        listen 80;
        root /your_lumen_project_dir/public;
        index index.php;
        server_name dev.yoursite_api.com;

        location / {
                if ($request_method = 'OPTIONS') {
                    # always 让201 203 202,204 这样的状态浏览器console不报错
                    add_header 'Access-Control-Allow-Origin' '*' always;
                    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELTE, PATCH,OPTIONS';
                    #
                    # Custom headers and headers various browsers *should* be OK with but aren't
                    #
                    add_header 'Access-Control-Allow-Headers' 'X-Requested-With,Content-Type,Authorization';
                    # 告诉浏览器这个options请求缓存有效期为20天,optioms请求次数.使app更流畅
                    add_header 'Access-Control-Max-Age' 1728000;
                    add_header 'Content-Type' 'text/plain; charset=utf-8';
                    add_header 'Content-Length' 0;
                    #options 请求直接让nginx响应不经过php脚本,节省响应时间
                    return 204;
                }
                try_files $uri $uri/ /index.php?$query_string;
        }
        location ~ \.php$ {
                try_files $uri /index.php =404;
                fastcgi_split_path_info ^(.+\.php)(/.+)$;
		        fastcgi_pass   127.0.0.1:9000;
                #fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
                fastcgi_index index.php;
                fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
                include fastcgi_params;
                #下面几行和上面一样的
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST,PUT,DELTE,PATCH,OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'X-Requested-With,Content-Type,Authorization';
        }

        error_log  /your_lumen_project_dir/storage/logs/nginx/error.log;
        access_log /your_lumen_project_dir/storage/logs/nginx/access.log;
}

```

#### 优点

- 减轻后端代码的压力,nginx的性能比php更好
- 支持https繁琐需要申请两个证书

#### 缺点

- 配置复杂
- 不能减少options请求

### nginx配置使web和api在同一个域名下

nginx配置文件`vuejs_n_lumen.conf`

```yaml
server {
        listen       80;
        server_name  dev.yoursite.com;
        # /your_vuejs_spa_dir/dist 使用ctrl+r 替换成您的vuejs编译之后的目录
        root /your_vuejs_spa_dir/dist;
        # warning 不要把 `$is_args$args` 替换为 `$query_string` 会导致query参数应用中接收不到 
        location / {
            try_files $uri $uri/ /index.html$is_args$args;
        }
        # /web/ 使用ctrl+r 替换为您lumen/laravel api的前缀(分组路由)
        # eg laravel/lemen 路由分组为 api 者把/web/替换为 api
        # /web/ 替换有4出
        location /web/ {
            #  /your_lumen_project_dir/public替换为您laravel/lumen的public目录
            root /your_lumen_project_dir/public;
            rewrite ^/web/(.*)$ /$1 break;  # web 替换为lumne/laravel路由分组prefix的值api
            try_files $uri $uri/ /web/index.php$is_args$args; # web 替换为lumne/laravel路由分组prefix的值api
            location ~ \.php$ {
                rewrite ^/web/(.*)$ /$1 break; # web 替换为lumne/laravel路由分组prefix的值api
                fastcgi_pass   127.0.0.1:9000;
                fastcgi_index  index.php;
                fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
                include        fastcgi_params;
            }
        }
        #error_log  /your_lumen_project_dir/storage/logs/nginx/error_fe.log;
        #access_log /your_lumen_project_dir/storage/logs/nginx/access_fe.log;
}
```

#### 优点

- 根本上消除了跨域问题,接受options请求时间
- 支持https更容易,不要申请两个证书

#### 缺点

- 收到服务器运维的限制

## 结束语

- 支持https的配置您们可自己更具网上教程自己添加
- 特别使第三种方案可以支持php的其他框架,可以扩展支持`python`,`golang`等语言

### 参考文档

- [HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)
- [Enable CORS_Nginx](https://enable-cors.org/server_nginx.html)