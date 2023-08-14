---
layout: post
title: Laravel添加MySQL定时备份
category: Misc
tags: laravel mysql 定时任务 php
keywords: php,lumen,laravel,mysql,备份,定时任务
description: 为laravel/lumen添加mysql定时备份任务
date: 2018-12-26T13:19:54+08:00
---

## 背景

公司项目需要做数据定时任务备份,不想依靠OPS同学.执行在lumen框架内实现数据库备份功能

### Feature

- 依赖laravel/lumen框架现有的功能
- 实现非常简单,不麻烦DBA或者OPS

## 依赖类

- 备份MYSQL`app/Utils/MySQLDump.php`

```php
<?php

namespace App\Utils;

use Exception;
use mysqli;

/**
 * MySQL database dump.
 *
 * @author     David Grudl (http://davidgrudl.com)
 * @copyright  Copyright (c) 2008 David Grudl
 * @license    New BSD License
 */
class MySQLDump
{
    const MAX_SQL_SIZE = 1e6;

    const NONE = 0;
    const DROP = 1;
    const CREATE = 2;
    const DATA = 4;
    const TRIGGERS = 8;
    const ALL = 15; // DROP | CREATE | DATA | TRIGGERS

    /** @var array */
    public $tables = [
        '*' => self::ALL,
    ];

    /** @var mysqli */
    private $connection;


    /**
     * Connects to database.
     * @param mysqli $connection
     * @param string $charset
     * @throws Exception
     */
    public function __construct(mysqli $connection, $charset = 'utf8')
    {
        $this->connection = $connection;

        if ($connection->connect_errno) {
            throw new Exception($connection->connect_error);

        } elseif (!$connection->set_charset($charset)) { // was added in MySQL 5.0.7 and PHP 5.0.5, fixed in PHP 5.1.5)
            throw new Exception($connection->error);
        }
    }


    /**
     * Saves dump to the file.
     * @param  string filename
     * @return void
     * @throws Exception
     */
    public function save($file)
    {
        $handle = strcasecmp(substr($file, -3), '.gz') ? fopen($file, 'wb') : gzopen($file, 'wb');
        if (!$handle) {
            throw new Exception("ERROR: Cannot write file '$file'.");
        }
        $this->write($handle);
    }


    /**
     * Writes dump to logical file.
     * @param  resource
     * @return void
     * @throws Exception
     */
    public function write($handle = null)
    {
        if ($handle === null) {
            $handle = fopen('php://output', 'wb');
        } elseif (!is_resource($handle) || get_resource_type($handle) !== 'stream') {
            throw new Exception('Argument must be stream resource.');
        }

        $tables = $views = [];

        $res = $this->connection->query('SHOW FULL TABLES');
        while ($row = $res->fetch_row()) {
            if ($row[1] === 'VIEW') {
                $views[] = $row[0];
            } else {
                $tables[] = $row[0];
            }
        }
        $res->close();

        $tables = array_merge($tables, $views); // views must be last

        $this->connection->query('LOCK TABLES `' . implode('` READ, `', $tables) . '` READ');

        $db = $this->connection->query('SELECT DATABASE()')->fetch_row();
        fwrite($handle, '-- Created at ' . date('j.n.Y G:i') . " using David Grudl MySQL Dump Utility\n"
            . (isset($_SERVER['HTTP_HOST']) ? "-- Host: $_SERVER[HTTP_HOST]\n" : '')
            . '-- MySQL Server: ' . $this->connection->server_info . "\n"
            . '-- Database: ' . $db[0] . "\n"
            . "\n"
            . "SET NAMES utf8;\n"
            . "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n"
            . "SET FOREIGN_KEY_CHECKS=0;\n"
            . "SET UNIQUE_CHECKS=0;\n"
            . "SET AUTOCOMMIT=0;\n"
        );

        foreach ($tables as $table) {
            $this->dumpTable($handle, $table);
        }

        fwrite($handle, "COMMIT;\n");
        fwrite($handle, "-- THE END\n");

        $this->connection->query('UNLOCK TABLES');
    }


    /**
     * Dumps table to logical file.
     * @param  resource
     * @return void
     */
    public function dumpTable($handle, $table)
    {
        $delTable = $this->delimite($table);
        $res = $this->connection->query("SHOW CREATE TABLE $delTable");
        $row = $res->fetch_assoc();
        $res->close();

        fwrite($handle, "-- --------------------------------------------------------\n\n");

        $mode = isset($this->tables[$table]) ? $this->tables[$table] : $this->tables['*'];
        $view = isset($row['Create View']);

        if ($mode & self::DROP) {
            fwrite($handle, 'DROP ' . ($view ? 'VIEW' : 'TABLE') . " IF EXISTS $delTable;\n\n");
        }

        if ($mode & self::CREATE) {
            fwrite($handle, $row[$view ? 'Create View' : 'Create Table'] . ";\n\n");
        }

        if (!$view && ($mode & self::DATA)) {
            fwrite($handle, 'ALTER ' . ($view ? 'VIEW' : 'TABLE') . ' ' . $delTable . " DISABLE KEYS;\n\n");
            $numeric = [];
            $res = $this->connection->query("SHOW COLUMNS FROM $delTable");
            $cols = [];
            while ($row = $res->fetch_assoc()) {
                $col = $row['Field'];
                $cols[] = $this->delimite($col);
                $numeric[$col] = (bool)preg_match('#^[^(]*(BYTE|COUNTER|SERIAL|INT|LONG$|CURRENCY|REAL|MONEY|FLOAT|DOUBLE|DECIMAL|NUMERIC|NUMBER)#i', $row['Type']);
            }
            $cols = '(' . implode(', ', $cols) . ')';
            $res->close();


            $size = 0;
            $res = $this->connection->query("SELECT * FROM $delTable", MYSQLI_USE_RESULT);
            while ($row = $res->fetch_assoc()) {
                $s = '(';
                foreach ($row as $key => $value) {
                    if ($value === null) {
                        $s .= "NULL,\t";
                    } elseif ($numeric[$key]) {
                        $s .= $value . ",\t";
                    } else {
                        $s .= "'" . $this->connection->real_escape_string($value) . "',\t";
                    }
                }

                if ($size == 0) {
                    $s = "INSERT INTO $delTable $cols VALUES\n$s";
                } else {
                    $s = ",\n$s";
                }

                $len = strlen($s) - 1;
                $s[$len - 1] = ')';
                fwrite($handle, $s, $len);

                $size += $len;
                if ($size > self::MAX_SQL_SIZE) {
                    fwrite($handle, ";\n");
                    $size = 0;
                }
            }

            $res->close();
            if ($size) {
                fwrite($handle, ";\n");
            }
            fwrite($handle, 'ALTER ' . ($view ? 'VIEW' : 'TABLE') . ' ' . $delTable . " ENABLE KEYS;\n\n");
            fwrite($handle, "\n");
        }

        if ($mode & self::TRIGGERS) {
            $res = $this->connection->query("SHOW TRIGGERS LIKE '" . $this->connection->real_escape_string($table) . "'");
            if ($res->num_rows) {
                fwrite($handle, "DELIMITER ;;\n\n");
                while ($row = $res->fetch_assoc()) {
                    fwrite($handle, "CREATE TRIGGER {$this->delimite($row['Trigger'])} $row[Timing] $row[Event] ON $delTable FOR EACH ROW\n$row[Statement];;\n\n");
                }
                fwrite($handle, "DELIMITER ;\n\n");
            }
            $res->close();
        }

        fwrite($handle, "\n");
    }


    private function delimite($s)
    {
        return '`' . str_replace('`', '``', $s) . '`';
    }
}
```

- 恢复MYSQL`app/Utils/MySQLImport.php`

```php
<?php
namespace App\Utils;

use Exception;
use mysqli;

class MySQLImport
{
    /** @var callable  function (int $count, ?float $percent): void */
    public $onProgress;

    /** @var mysqli */
    private $connection;


    /**
     * Connects to database.
     * @param mysqli $connection
     * @param string $charset
     * @throws Exception
     */
    public function __construct(mysqli $connection, $charset = 'utf8')
    {
        $this->connection = $connection;

        if ($connection->connect_errno) {
            throw new Exception($connection->connect_error);

        } elseif (!$connection->set_charset($charset)) { // was added in MySQL 5.0.7 and PHP 5.0.5, fixed in PHP 5.1.5)
            throw new Exception($connection->error);
        }
    }


    /**
     * Loads dump from the file.
     * @param  string filename
     * @return int
     * @throws Exception
     */
    public function load($file)
    {
        $handle = strcasecmp(substr($file, -3), '.gz') ? fopen($file, 'rb') : gzopen($file, 'rb');
        if (!$handle) {
            throw new Exception("ERROR: Cannot open file '$file'.");
        }
        return $this->read($handle);
    }


    /**
     * Reads dump from logical file.
     * @param  resource
     * @return int
     * @throws Exception
     */
    public function read($handle)
    {
        if (!is_resource($handle) || get_resource_type($handle) !== 'stream') {
            throw new Exception('Argument must be stream resource.');
        }

        $stat = fstat($handle);

        $sql = '';
        $delimiter = ';';
        $count = $size = 0;

        while (!feof($handle)) {
            $s = fgets($handle);
            $size += strlen($s);
            if (strtoupper(substr($s, 0, 10)) === 'DELIMITER ') {
                $delimiter = trim(substr($s, 10));

            } elseif (substr($ts = rtrim($s), -strlen($delimiter)) === $delimiter) {
                $sql .= substr($ts, 0, -strlen($delimiter));
                if (!$this->connection->query($sql)) {
                    throw new Exception($this->connection->error . ': ' . $sql);
                }
                $sql = '';
                $count++;
                if ($this->onProgress) {
                    call_user_func($this->onProgress, $count, isset($stat['size']) ? $size * 100 / $stat['size'] : null);
                }

            } else {
                $sql .= $s;
            }
        }

        if (rtrim($sql) !== '') {
            $count++;
            if (!$this->connection->query($sql)) {
                throw new Exception($this->connection->error . ': ' . $sql);
            }
            if ($this->onProgress) {
                call_user_func($this->onProgress, $count, isset($stat['size']) ? 100 : null);
            }
        }

        return $count;
    }
}

```

### 业务代码实现

- 备份artisan命令`php artisan mysql:backup` 文件名`app/Console/Commands/MysqlBackupCommand.php`

```php
<?php
/**
 * Copyright (c) 2018.  Https://github.com/libragen
 */


namespace App\Console\Commands;

use App\Utils\MySQLDump;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use mysqli;

class MysqlBackupCommand extends Command
{


    protected $signature = 'mysql:backup';


    protected $description = 'venom数据库备份;备份数据库到php项目storage/目录';


    public function __construct()
    {
        if (!function_exists('mysqli_init') && !extension_loaded('mysqli')) {
            $msg = "php mysqli 扩展没有开启,请求ops同学开启php-sqli扩展";
            Log::error($msg);
            dd($msg);
        }
        parent::__construct();
    }

    /**
     *
     */
    public function handle()
    {
        $file = date('Y_md_Hi_s');
        $backupFile = storage_path("$file.sql");
        $db = new mysqli(env('DB_HOST'), env('DB_USERNAME'), env('DB_PASSWORD'), env('DB_DATABASE'), env('DB_PORT'));
        try {
            $dump = new MySQLDump($db);
            $dump->save($backupFile);
            $msg = "数据库已经备份到:$backupFile";
            echo $msg;
            Log::info($msg);
        } catch (\Exception $e) {
            Log::Error('备份数据库失败:' . $e->getMessage(), $e->getTrace());
        }
    }
}
```

- 恢复mysql命令`php artisan mysql:restore` 文件名`app/Console/Commands/MysqlRestoreCommand.php`

```php
<?php
/**
 * Copyright (c) 2018.  Https://github.com/libragen
 */

namespace App\Console\Commands;

use App\Utils\MySQLImport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use mysqli;

class MysqlRestoreCommand extends Command
{


    protected $signature = 'mysql:restore {index=-1}';


    protected $description = '恢复数据库数据';

    protected $sqlPath;

    public function __construct()
    {
        parent::__construct();


        if (!function_exists('mysqli_init') && !extension_loaded('mysqli')) {
            $msg = "php mysqli 扩展没有开启,请求ops同学开启php-sqli扩展";
            Log::error($msg);
            dd($msg);
        }


    }

    /**
     *
     */
    public function handle()
    {
        $sqlFilePath = $this->getSqlPath();
        $db = new mysqli(env('DB_HOST'), env('DB_USERNAME'), env('DB_PASSWORD'), env('DB_DATABASE'), env('DB_PORT'));
        try {
            $import = new MySQLImport($db);
            $import->load($sqlFilePath);
            $msg = "数据库恢复成功:$sqlFilePath";
            echo $msg;
            Log::info($msg);
        } catch (\Exception $e) {
            $msg = '恢复数据库失败:' . $e->getMessage();
            echo $msg;
            Log::Error($msg, $e->getTrace());

        }
    }

    private function getSqlPath()
    {
        $logsDir = storage_path();
        $temps = [];
        foreach (scandir($logsDir) as $kk => $vv) {
            if (strpos($vv, '.sql') > 1) {
                $temps[] = $vv;
            }
        }
        $idx = $this->argument('index');
        if (isset($temps[$idx])) {
            return storage_path($temps[$idx]);
        } else {
            echo "没有找到,您要恢复的sql文件,请输入正确的sql文件序号\r\n";

            foreach ($temps as $kk => $vv) {
                echo "$kk \t $vv\r\n";
            }
            echo "请选择要恢复的sql文件的序号(数字)\r\n";
            echo "eg php artian mysql:restore 1\r\n";

            die();
        }
    }
}
```

- 添加定时任务`app/Console/Kernel.php`

```php
<?php

namespace App\Console;

use App\Console\Commands\DepartmentCommand;
use App\Console\Commands\EquipmentCommand;
use App\Console\Commands\MysqlBackupCommand;
use App\Console\Commands\MysqlRestoreCommand;
use Illuminate\Console\Scheduling\Schedule;
use Laravel\Lumen\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        MysqlBackupCommand::class,
        MysqlRestoreCommand::class,
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        //备份msyql数据库 每天凌晨备份数据库
        $schedule->command(MysqlBackupCommand::class)->dailyAt('03:03');
    }
}

```

## 致谢

- [Github-mysqldump-php](https://github.com/ifsnop/mysqldump-php/blob/master/src/Ifsnop/Mysqldump/Mysqldump.php)
