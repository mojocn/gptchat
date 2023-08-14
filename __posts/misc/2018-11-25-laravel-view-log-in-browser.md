---
layout: post
title: 在浏览器里查看laravel日志文件
category: Misc
tags: laravel lumen 日志 log
keywords: php,lumen,laravel,日志,log
description: 为laravel/lumen添加日志查看接口
date: 2018-12-26T13:19:54+08:00
---

## 背景

方便查看laravel日志,不需要登陆服务器

## 实现

- 控制器`app/Http/Controllers/Web/DebugController.php`

```php
<?php
/**
 * Copyright (c) 2018.  Https://github.com/libragen
 */

namespace App\Http\Controllers\Web;

use App\Http\Controllers\BaseController;
use Illuminate\Http\Request;


class DebugController extends BaseController
{

    public function logs(Request $request)
    {
        $password = $request->input('p');
        echo "<style> li { display:inline;list-style: none;padding-right: 15px;float: left}</style>";
        if ($password !== 'venom') {
            echo "<h1 style='color:blue;text-align: center'><a href='logs?p=密码'>请在浏览器地址后面输密码</a></h1>";
            echo "<p><a href='logs?p=密码'>浏览器中替换正确的密码</a></p>";
            echo "<p>eg:<pre>****/web/debug/logs?p=您的密码</pre> </p>";
            exit(200);
        }
        echo "<h2 style='color:orangered;text-align: center'>日志列表</h2>";
        $logsDir = storage_path('logs');
        echo "<ul style='text-align: center'>";
        foreach (scandir($logsDir) as $kk => $vv) {
            if (strpos($vv, '.log') > 1) {
                echo "<li><a href='logs?p=$password&path=$vv'>$vv</a>";
            }
        }
        echo "</ul> <hr style='clear: both;margin-top: 90px'>";

        $logPath = $request->input('path');
        if (!empty($logPath)) {
            $filePath = storage_path("logs/$logPath");
            $con = file_get_contents($filePath);
            echo "<h2 style='color:red;text-align: center'>需要搜索日志关键字请使用 contrl+ F</h2>";
            echo "<h3 style='color:orange;text-align: center'>$logPath</h3>";
            echo "<pre style='margin: 20px;background: black;color: white;padding: 8px;font-size: 16px'>$con</pre>";
        }
        exit(200);
    }

}
```

- 路由文件`routes/api_web.php`

```php
<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/
/**
 * 给自己html5 页面调用的接口
 */
$router->group(['namespace' => 'Web', 'prefix' => 'web'], function () use ($router) {
    $router->get('version', function () use ($router) {
        return $router->app->version();
    });
    $router->get('debug/logs', 'DebugController@logs');
});

```

## 实际效果

![laravel-logs-view-in-browser](/assets/image/lumen_logs.png)

## 致谢

- [php-scan-files](http://php.net/manual/zh/function.scandir.php)
