---
layout: post
title: 牛奶猫的任务罢了（part2）
date: 2026-03-17 19:33:09
cover: https://www.cachetide.top/cywl.jpg
categories: [技术]
tags: [docker,sm]
---

# 学会go语言

## go环境配置

### win

下载安装go的.msi安装包进行安装，默认路径为`C:\Go`

在**编辑系统环境变量**中，找到**系统变量**，在**Path**添加**c:\Go\bin**

### Arch Linux

```
sudo pacman -S go
```

编辑`~/.bashrc`，添加

```
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

### Mac

下载安装go的对应.pkg安装包进行安装

在终端里面

```
open .bash_profile
```

添加

```
export GOROOT=/usr/local/go
export PATH=$GOROOT/bin:$PATH:.
```

## 现代go项目

### 项目结构

*my-app为示例项目名字*

```
my-app/
├── cmd/                # 程序的入口点 (Main functions)
│   └── my-app/         # 每个子目录对应一个可执行程序
│       └── main.go
├── internal/           # 内部逻辑 (私有代码，禁止被其他项目导入)
│   ├── auth/           # 具体的业务逻辑包
│   ├── config/         # 配置加载逻辑
│   └── db/             # 数据库连接与迁移
├── pkg/                # 可以被外部项目引用的库代码 (可选)
├── api/                # API 定义 (如 Protobuf, Swagger, OpenAPI 等)
├── configs/            # 配置文件模版 (如 .yaml, .toml)
├── scripts/            # 编译、安装、分析等脚本 (Windows 下可用 .bat 或 .ps1)
├── test/               # 额外的测试数据或集成测试
├── go.mod              # 依赖管理 (核心文件)
├── go.sum              # 依赖校验
└── README.md
```

### 创建项目

初始化Go Module,`github.com/CacheTide/my-app`是模块路径，一般是github地址，可以保证全局唯一性，让代码可下载

```
go mod init github.com/CacheTide/my-app
```

基础目录只需要`cmd`, `internal`, `pkg`, `configs`，`cmd/my-app`，`cmd/my-app/main.go`

在编写好项目后，我们可以先运行看看

```
go run ./cmd/my-app/main.go
```

如果要生成exe程序可以

```
go build -o bin/my-app.exe ./cmd/my-app/main.go
```

会把代码编译成二进制文件，输出到 bin 文件夹

每次在代码里引入了新的第三方库可以运行一下这个命令，来自动下载依赖并清理不用的包。

```
go mod tidy
```

## 语法

推荐阅读https://gobyexample-cn.github.io/

`var` 声明 1 个或者多个变量。

`:=` 语法是声明并初始化变量的简写，Go 会自动推断已经有初始值的变量的类型

声明后却没有给出对应的初始值时，变量将会初始化为 *零值* 。 

 不带条件的 `for` 循环将一直重复执行， 直到在循环体内使用了 `break` 或者 `return` 跳出循环。 

if 和 else在条件语句之前可以有一个声明语句；在这里声明的变量可以在这个语句所有的条件分支中使用。

不接受值可以用`_`代替，否则会产生歧义

### 函数特性

#### 1. 可变参数 (Variadic Functions) 

场景：当你不知道用户会传进来多少个参数时（比如 `fmt.Println`），这个特性就派上用场了。

语法要点：

**定义**：使用 `...type`。在函数内部，这个参数会被当作**切片 (`[]int`)** 处理。

**调用**：可以传多个独立参数，也可以用 `slice...` 的方式将现有切片“解构”后传入。

```go
func sum(nums ...int) int {
    total := 0
    for _, num := range nums { // nums 在这里是一个 []int
        total += num
    }
    return total
}

// 调用方式 A：手动传参
sum(1, 2, 3) 

// 调用方式 B：打散切片传参
primes := []int{2, 3, 5}
sum(primes...) 
```

`...` 在定义时是“打包”，在调用时是“拆包”。一般用于实现工具类函数（如批量删除、格式化输出）

#### 2. 闭包 (Closures) —— 带着“记忆”的函数

场景：如果你想让一个函数拥有自己的“私有变量”，且这个变量在函数执行完后不消失，闭包是唯一的选择。

核心原理：

闭包 = **函数** + **引用环境**。它能捕获并“锁住”外部作用域的变量。

```go
func intSeq() func() int {
    i := 0
    return func() int {
        i++      // 引用了外部变量 i
        return i
    }
}

nextInt := intSeq()
fmt.Println(nextInt()) // 1
fmt.Println(nextInt()) // 2 (i 的值被保留了！)
```

闭包就像一个**轻量级的对象**。`i` 是私有属性，返回的匿名函数是公有方法。每调用一次 `intSeq` 都会产生一个完全独立的“记忆体”

#### 3. 递归 (Recursion) 

场景：处理树形结构（如文件目录）、数学计算（阶乘、斐波那契）时，递归能让代码极其简洁。

两个生死攸关的条件：

1. **基准情况 (Base Case)**：必须有一个停止条件（如 `n == 0`），否则会内存溢出（栈溢出）。
2. **递归步骤**：不断缩小问题规模。

```go
// 斐波那契数列：0, 1, 1, 2, 3, 5, 8...
var fib func(n int) int

fib = func(n int) int {
    if n < 2 { return n }      // 停止条件
    return fib(n-1) + fib(n-2) // 拆解问题
}
```

在 Go 中定义匿名递归函数，必须**先声明变量名**再赋值，否则函数体内部无法识别自己。递归重复计算会带来的性能损耗

**字符串是字节的集合**：`len()` 算的是字节，不是字数。

**`rune` 才是真正的字符**：它是 Unicode 码点的化身。处理中文/多语言文本，请永远使用 `rune`。

**`range` 会自动解码**：它是遍历字符串最省心的方式，会自动帮你把字节合并成字符。

**索引跳跃**：遍历非英文文本时，索引 `i` 不是 `+1` 增长的，而是根据字符编码宽度（如 `+3`）增长的。

方法：

1. **默认选择指针接收者 (`*T`)** 为了保持一致性，避免大数据拷贝带来的性能开销，以后可能需要修改结构体内部的值。
2. **选择值接收者 (`T`) 的场景** 结构体非常小（比如只有一两个简单的字段），你明确希望这个方法是“只读”的，且不希望外部状态影响内部。
3. **不要混用** 虽然 Go 支持自动转换，但为了代码的可读性，建议一个结构体的所有方法要么全用指针接收者，要么全用值接收者。

**Embedding**：在一个结构体里面可以嵌入另一个结构体并调用，当创建含有嵌入的结构体，必须对嵌入进行显式的初始化； 在这里使用嵌入的类型当作字段的名字。

**Goroutine (协程)**：是由 Go 运行时（Runtime）管理的轻量级线程，上下文切换在用户态完成，不涉及昂贵的系统调用，创建一个线程约需 1MB 内存，而一个 Goroutine 仅需 2KB。

### 通道

#### 通道与缓冲 (Buffering)

通道是协程间通信的管道。

**无缓冲通道**

```
make(chan int)
```

特性：必须“手递手”交接。发送者必须等到接收者准备好，否则一直阻塞。适用于**强同步**场景。

缓冲通道

```
make(chan int, 10)
```

特性：自带“快递柜”。柜子没满时，发送者塞进去就能走；柜子空了，接收者才阻塞。适用于**削峰填谷**场景。

#### 通道同步 (Synchronization)

利用通道的**阻塞特性**来控制程序的执行流。

场景：主线程等待子协程干完活再退出。

**做法**：主线程通过 `<-done` 阻塞，子协程任务结束执行 `done <- true` 发送信号。

#### 通道方向 (Directions)

通过箭头 `<-` 限制函数的权限，防止误用。

**`chan<- T` (只写)**：只能往里塞数据。通常作为“生产者”。

**`<-chan T` (只读)**：只能往外取数据。通常作为“消费者”。

价值：利用**编译期检查**提升代码健壮性，遵循最小权限原则。

#### 通道选择器 (Select)

`select` 能够让你同时监听多个通道的操作。

特性：哪个通道先就绪（有数据或能写入），就执行哪个分支。

应用：处理多路 I/O、聚合多个服务的结果。

#### 超时处理 (Timeouts)

在分布式系统中，死等是最危险的行为。利用 `select` 配合 `time.After` 实现自动放弃。

```go
select {
case res := <-c1:
    fmt.Println(res)
case <-time.After(1 * time.Second):
    fmt.Println("timeout 1") // 1秒没回就撤
}
```

#### 非阻塞通道操作 (Non-Blocking)

当你不想让程序在通道操作上“卡住”时，使用 `select` 的 `default` 分支。

**做法**：如果通道没准备好，立即跳到 `default` 执行备选逻辑，而不是原地等待。

#### 通道的关闭 (Closing)

当不再有数据发送时，应该关闭通道：`close(ch)`。

1. 只有**发送者**应该关闭通道，接收者关闭会报错。
2. 从已关闭的通道读取会立即返回该类型的**零值**（如 0 或 ""）。
3. 通过 `v, ok := <-ch` 中的 `ok` 来判断通道是否已关闭（`false` 代表已关闭）。

#### 通道遍历 (Range over Channels)

你可以像遍历切片一样遍历通道：

```
for j := range queue {
    fmt.Println(j)
}
```

特性：这个循环会一直跑，直到通道被 `close` 掉才会优雅退出。这是处理任务队列的最佳实践。

### WaitGroup

**它是并发计数器**：主程序启动一个任务就 `Add(1)`，任务干完活就 `Done()`（计数减 1）。

**它是阻塞哨兵**：主程序运行到 `Wait()` 时会原地停下，死死盯着计数器，只要不是 0 就不准过。

**它是同步保障**：它保证了无论后台有 10 个还是 1000 个协程在跑，主程序都能精准地等它们全部打卡下班后再收工。

### 互斥锁 (Mutex)

**它是“并发保险栓”**：通过 `Lock()` 和 `Unlock()` 强制规定同一时刻只能有一个协程访问某段代码，防止数据被多人同时修改搞乱。

**它是 Map 的救星**：Go 语言的 `map` 天生不支持多人同时写，不加锁程序会直接崩溃（Panic），互斥锁是保护共享数据的标准方案。

**它是性能与安全的权衡**：虽然排队（阻塞）会让程序稍微变慢，但它换来了**绝对的数据准确性**，是处理银行余额、库存计数等核心业务的唯一选择。

### 状态协程

**数据私有化**：创建一个专属的“管理员协程”持有共享数据（如 Map），外界严禁直接访问，从而彻底消除了并发竞争。

**消息代办制**：其他协程想读写数据时，必须填好“申请单”（带回执通道的结构体）发给管理员，在管理员的 `select` 循环里排队处理。

**逻辑线性化**：因为数据永远只由一个协程在操作，复杂的并发读写变成了简单的单线程逻辑，既避开了死锁，又让代码极其易于维护。

```go
package main

import (
    "fmt"
    "math/rand"
    "sync/atomic"
    "time"
)

type readOp struct {
    key  int
    resp chan int
}
type writeOp struct {
    key  int
    val  int
    resp chan bool
}

func main() {

    var readOps uint64
    var writeOps uint64

    reads := make(chan readOp)
    writes := make(chan writeOp)

    go func() {
        var state = make(map[int]int)
        for {
            select {
            case read := <-reads:
                read.resp <- state[read.key]
            case write := <-writes:
                state[write.key] = write.val
                write.resp <- true
            }
        }
    }()

    for r := 0; r < 100; r++ {
        go func() {
            for {
                read := readOp{
                    key:  rand.Intn(5),
                    resp: make(chan int)}
                reads <- read
                <-read.resp
                atomic.AddUint64(&readOps, 1)
                time.Sleep(time.Millisecond)
            }
        }()
    }

    for w := 0; w < 10; w++ {
        go func() {
            for {
                write := writeOp{
                    key:  rand.Intn(5),
                    val:  rand.Intn(100),
                    resp: make(chan bool)}
                writes <- write
                <-write.resp
                atomic.AddUint64(&writeOps, 1)
                time.Sleep(time.Millisecond)
            }
        }()
    }

    time.Sleep(time.Second)

    readOpsFinal := atomic.LoadUint64(&readOps)
    fmt.Println("readOps:", readOpsFinal)
    writeOpsFinal := atomic.LoadUint64(&writeOps)
    fmt.Println("writeOps:", writeOpsFinal)
}
```

### panic

**立即停止**：当前的常规控制流会立即中断。

**清理战场**：程序会开始逐层向上执行所有已声明的 `defer` 函数（如果有的话）。

**崩溃退出**：打印出错误信息和堆栈轨迹（Stack Trace），然后结束整个进程。

**返回非零状态码**：告知操作系统程序运行失败

### recover 

**必须在 `defer` 函数中调用**：因为 `panic` 发生时，常规代码都停了，只有 `defer` 里的代码会被执行。

**必须在同一个协程中**：`recover` 只能捕获当前协程（Goroutine）内的 `panic`，管不了别人的闲事。

**返回值**：如果没发生 `panic`，`recover()` 返回 `nil`；如果发生了，它会返回 `panic` 传进去的那个错误信息。

### 字符串函数 (`strings`)：文本拆解

```go
package main
import ("fmt"; "strings")

func main() {
    s := "hello-world-go"
    fmt.Println(strings.Contains(s, "go"))     // true (包含)
    fmt.Println(strings.Split(s, "-"))         // [hello world go] (切分)
    fmt.Println(strings.ToUpper(s))            // HELLO-WORLD-GO (转大写)
    fmt.Println(strings.Replace(s, "go", "gin", 1)) // hello-world-gin (替换)
}
```

### 字符串格式化 (`fmt`)：万能打印

```go
package main
import "fmt"

func main() {
    type user struct { name string; id int }
    u := user{"CacheTide", 101}
    
    fmt.Printf("%+v\n", u)  // {name:CacheTide id:101} (打印字段名)
    fmt.Printf("%T\n", u)   // main.user (打印类型)
    
    s := fmt.Sprintf("ID: %d", u.id) // 生成字符串，不打印
    fmt.Println(s)
}
```

### 文本模板 (`template`)：动态渲染

```go
package main
import ("os"; "text/template")

func main() {
    t := template.Must(template.New("t").Parse("Hi {{.}}, welcome!\n"))
    t.Execute(os.Stdout, "CacheTide") // Hi CacheTide, welcome!
}
```

### 正则表达式 (`regexp`)：格式校验

```go
package main
import ("fmt"; "regexp")

func main() {
    match, _ := regexp.MatchString("p([a-z]+)ch", "peach")
    fmt.Println(match) // true
    
    r := regexp.MustCompile("p([a-z]+)ch")
    fmt.Println(r.ReplaceAllString("a peach", "<fruit>")) // a <fruit>
}
```

### JSON 处理 (`json`)：前后端交互

```go
package main
import ("encoding/json"; "fmt")

func main() {
    type User struct { Name string `json:"user_name"` }
    
    // 序列化：转 JSON
    u := User{Name: "CacheTide"}
    b, _ := json.Marshal(u)
    fmt.Println(string(b)) // {"user_name":"CacheTide"}

    // 反序列化：解析 JSON
    var u2 User
    json.Unmarshal(b, &u2)
    fmt.Println(u2.Name) // CacheTide
}
```

### XML 处理 (`xml`)：结构化数据

```go
package main
import ("encoding/xml"; "fmt")

func main() {
    type Plant struct {
        XMLName xml.Name `xml:"plant"`
        Id      int      `xml:"id,attr"` // 作为属性
        Name    string   `xml:"name"`    // 作为子元素
    }
    p := Plant{Id: 1, Name: "Coffee"}
    out, _ := xml.MarshalIndent(p, "", "  ")
    fmt.Println(string(out)) 
    // <plant id="1">
    //   <name>Coffee</name>
    // </plant>
}
```

### 读写文件 (`os` & `io`)

Go 提供了从“一行代码搞定”到“精细化流式控制”的多层次支持。

- 全文件读写（简单小文件）

  `os.ReadFile(name)`：一键读取全部内容到 `[]byte`。

  `os.WriteFile(name, data, perm)`：一键创建并写入。

- 精细控制（大文件/流式）

  `f, err := os.Open(name)`：只读模式打开。

  `f, err := os.Create(name)`：创建或覆盖。

  `f, err := os.OpenFile(name, flag, perm)`：高度自定义（如追加模式 `os.O_APPEND`）。

  **军规**：打开文件后务必紧跟 `defer f.Close()`。

------

### 行过滤器 (Line Filters)

处理大文件（如日志、CSV）时，一次性读入内存会撑爆系统。**逐行处理**是最佳实践。

**核心工具**：`bufio.NewScanner(os.Stdin)` 或 `bufio.NewScanner(file)`。

**逻辑**：通过 `scanner.Scan()` 循环读取，`scanner.Text()` 获取当前行内容。

**场景**：日志清洗、文本搜索工具（类似 `grep`）。

------

### 文件路径 (`path/filepath`)

**永远不要**使用字符串拼接路径（如 `dir + "/" + file`），因为 Windows (`\`) 和 Linux (`/`) 的分隔符不同。

**`filepath.Join("dir", "sub", "file.txt")`**：根据系统自动生成正确路径（**必用**）。

**`filepath.Ext(path)`**：获取扩展名（如 `.jpg`）。

**`filepath.Base(path)`**：获取文件名。

**`filepath.Abs(path)`**：将相对路径转为绝对路径。

------

### 目录操作 (`os`)

管理文件夹的层级结构。

**`os.MkdirAll("a/b/c", 0755)`**：递归创建多级目录（类似 `mkdir -p`），最推荐使用。

**`os.ReadDir("dir")`**：列出目录下的文件和文件夹（非递归）。

**`os.RemoveAll("dir")`**：彻底删除文件夹及其内容（类似 `rm -rf`）。

------

### 目录遍历 (`filepath.Walk`)

当需要扫描整个工程或清理多层级的日志时，使用递归遍历。

**`filepath.Walk(root, walkFunc)`**：自动进入每一层子目录。

**`walkFunc`**：回调函数，提供路径、文件信息和错误处理。

**进阶**：Go 1.16+ 推荐使用 `filepath.WalkDir`，性能比 `Walk` 更高。

------

### 临时文件与目录 (`os`)

在运行单元测试或处理中间产物时，需要创建“用完即焚”的文件。

**`os.CreateTemp("", "prefix")`**：在系统临时目录创建唯一文件。

**`os.MkdirTemp("", "dir-prefix")`**：创建唯一临时文件夹。

**清理**：配合 `defer os.Remove(f.Name())` 确保程序结束时自动删除。

### 单元测试与基准测试 (`testing` 包)

Go 官方内置了强大的测试工具，要求测试文件必须以 `_test.go` 结尾。

**单元测试 (`TestXxx`)**

表格驱动测试：定义一个切片包含 `input` 和 `want`，循环调用 `t.Run` 执行。这是 Go 社区的**灵魂写法**。

核心逻辑：使用 `t.Errorf` 报告错误，不要使用 `panic` 或 `os.Exit`。

**基准测试 (`BenchmarkXxx`)**

循环 `b.N` 次：框架会自动调整 `N` 的值，直到获得准确的每操作耗时（`ns/op`）。

**命令**：`go test -v -bench=.`

------

### 命令行参数 (`os.Args`)

最原始、最直接的获取外部输入的方式。

获取方式os.Args是一个字符串切片。

`os.Args[0]`：程序本身的路径。

`os.Args[1:]`：用户输入的参数。

**场景**：简单的脚本，或者只需要接收一个文件名时使用。

------

### 命令行标志 (`flag` 包)

这是构建专业命令行工具（CLI）的标准方式，支持 `-name=value` 这种语法。

定义方式

`ptr := flag.String("name", "default", "usage")`：返回指针。

`flag.Parse()`：必做。不解析则拿不到值。

**优点**：自动处理类型转换（int, bool, string），并提供自动生成的 `-help` 帮助文档。

------

### 命令行子命令 (`flag.NewFlagSet`)

模拟 `git add` 或 `docker run` 这种多级指令。

核心逻辑

为每个子命令创建一个独立的 `FlagSet`。

根据 `os.Args[1]` 的值进行 `switch` 判断。

分别解析对应的子命令标志。

**场景**：复杂的工具软件（如同时支持 `upload` 和 `download` 两种模式）。

------

### 环境变量 (`os` 包)

现代微服务和 Docker 部署的**首选配置方式**。

`os.Setenv(key, val)`：设置变量。

`os.Getenv(key)`：读取变量。

`os.Environ()`：获取所有环境变量。

**场景**：存放数据库密码、API 密钥、运行模式（`GIN_MODE=release`）。

### HTTP 客户端 (`net/http`)

Go 内置了功能极其强大的 HTTP 客户端，支持连接池、超时控制和自动重定向。

**简单请求**：`resp, err := http.Get(url)`。

**精细控制**：使用 `http.NewRequest` 构造请求，可以自定义 Header、Cookie 或发送 JSON Body。

1. **必须 `defer resp.Body.Close()`**，否则会导致连接泄露。
2. 读取完 Body 后，可以使用 `io.ReadAll(resp.Body)` 获取内容。

------

### HTTP 服务端 (`net/http`)

这是 Go 语言最引以为傲的部分，也是 Gin 框架的底层基石。

**注册路由**：`http.HandleFunc("/pattern", handler)`。

**启动监听**：`http.ListenAndServe(":8080", nil)`。

**高并发基因**：每个进来的请求都会**自动在一个独立的 Goroutine 中运行**，这让 Go 天生具备极高的吞吐量。

------

### Context 上下文 (`context` 包)

在高并发 Web 服务中，`Context` 是**同步信号和请求范围数据**的传递者。

**超时控制 (`WithTimeout`)**：如果一个数据库查询超过 2 秒没回，自动取消请求，防止资源浪费。

**级联取消**：当主请求被用户关闭时，底层的 SQL 查询、RPC 调用都会通过 `ctx.Done()` 接收到信号并自动停止。

**核心准则**：`Context` 应该是函数的第一个参数：`func DoSomething(ctx context.Context, ...)`。

------

### 生成进程与执行进程 (`os/exec`)

让你的 Go 程序调用外部命令（如 `ls`, `git`, `docker`）。

**生成进程 (`Command`)**：启动一个外部命令，并读取它的输出结果。

**执行进程 (`Exec`)**：**用外部进程替换掉当前的 Go 进程**。这在编写 Wrapper 脚本或容器启动脚本时非常有用。

**场景**：自动化构建工具、调用 Python 脚本处理模型。

------

### 信号处理 (`os/signal`)

这是让服务**“优雅退出 (Graceful Shutdown)”**的关键。

**逻辑**：通过 `signal.Notify` 监听操作系统的信号（如 `SIGINT` 按下 Ctrl+C，或 `SIGTERM` 容器停止信号）。

1. 收到停止信号。
2. 停止接收新请求。
3. 等待现有请求处理完。
4. 关闭数据库连接，释放资源，最后退出。

**场景**：生产环境部署时，确保不会在更新代码瞬间断掉用户的正在进行的支付请求。

# containerd模仿docker compose

先看我们要干什么，首先是`docker compose up`,执行后，程序要找到目录下的 `compose.yaml` 文件，并看懂里面写了需要启动哪些服务、用什么镜像，然后连接到底层的容器运行环境让 `containerd` 去下载对应的镜像，并把容器运行起来。

所以需要命令行入口，配置文件解析器，容器引擎控制器

根据我上文所写， 我要先创建一个现代的项目结构，并且叫项目[mini-compose-Neo](https://github.com/CacheTide/mini-compose-Neo)~~（来点苹果笑话）~~

```bash
mkdir mini-compose-Neo
cd mini-compose-Neo
go mod init github.com/CacheTide/mini-compose-Neo
mkdir -p cmd/minicompose   # 存放主程序入口
mkdir -p pkg/compose       # 存放解析 YAML 的核心逻辑
mkdir -p pkg/engine        # 存放与 containerd 交互的逻辑
mkdir -p internal/utils    # 内部工具函数
```

根据ai的推荐，我们来安装依赖

```bash
# containerd 官方 SDK
go get github.com/containerd/containerd
# YAML 解析库
go get gopkg.in/yaml.v3
# CLI 框架
go get github.com/spf13/cobra
```

然后是**Makefile**，**GitHub Actions**，**Git**这三玩意，不过因为是写一个意思意思我先扔后面

我们先完成文件解析器，让程序能看懂要干啥

`./mini-compose-Neo/pkg/compose/parser.go`

```go
// 声明这个文件属于 compose 这个文件夹
package compose

// 引入需要用到的外部工具
import (
	"os"             // 操作系统的基本功能，用来读取文件
	"gopkg.in/yaml.v3" // 第三方工具，专门用来把 yaml 文本翻译成 Go 能看懂的数据
)

// 定义一张叫 Project 的填空表，代表整个 yaml 文件
type Project struct {
	// 遇到 yaml 里的 "version"，就把它填到这里的 Version 里
	Version  string             `yaml:"version"`
	// 遇到 yaml 里的 "services"，就把它们装进字典里
	Services map[string]Service `yaml:"services"`
}

// 定义一张叫 Service 的填空表，代表每个具体的服务
type Service struct {
	Image       string   `yaml:"image"`       // 镜像名字
    Environment []string `yaml:"environment"` // 环境变量列表(因为是列表所以用[])
	Command     []string `yaml:"command"`     // 启动命令列表
}

//定义函数Parse
func Parse(filename string) (*Project, error) {
	// 1. 调用系统工具，把硬盘上的文件内容全部读到内存里，存进 data 变量
	// 如果读取失败（比如文件不存在），err 就会记录错误信息
	data, err := os.ReadFile(filename)
	
	// 如果发生了错误，就直接退回，并把错误报告给上一级
	if err != nil {
		return nil, err
	}
	
	var project Project
	
	// 3. 使用 yaml 工具，把读到的 data 文本，自动填写到空白表 project 里
	// &project 代表把这张表的“物理地址”传过去，让工具直接在原表上修改
	if err := yaml.Unmarshal(data, &project); err != nil {
		return nil, err // 如果填表失败（比如格式不对），报错退出
	}
	
	// 4. 成功！把填好的表格（的地址）交回去
	return &project, nil
}
```

然后来完成容器引擎控制器

`./mini-compose-Neo/pkg/engine/containerd.go`

```go
package engine

import (
	"context" // 用来控制任务的超时和取消，就像给任务定个倒计时
	"fmt"     // 用来格式化打印文字
	"log"     // 用来在屏幕上打印日志（带时间戳）

    "github.com/containerd/containerd/cio"
	"github.com/containerd/containerd" // containerd 官方提供的遥控器
	"github.com/containerd/containerd/namespaces" // 命名空间工具，用来隔离数据
	"github.com/containerd/containerd/oci" // 容器标准工具
)

type Engine struct {
	client *containerd.Client // 操控 containerd 的遥控器
	ctx    context.Context    // 任务运行的上下文环境
}

// 建立连接的初始化函数
func NewEngine(sock string) (*Engine, error) {
	// 1. 拿起遥控器，连接到 containerd 的通信管道（socket）
	client, err := containerd.New(sock)
	if err != nil {
		return nil, err // 连不上就报错
	}
	
	// 2. 创建一个名为 "minicompose" 的独立房间（命名空间）
	// 这样我们的容器就不会跟 Docker 创建的容器混在一起打架了
	ctx := namespaces.WithNamespace(context.Background(), "minicompose")
	
	// 把遥控器和环境打包交出去
	return &Engine{client: client, ctx: ctx}, nil
}

// 真正干活的函数：根据服务名和镜像名，把容器跑起来
func (e *Engine) RunService(name, imageName string) error {
	log.Printf("正在拉取镜像 %s 给服务 %s...\n", imageName, name)
	
	// 步骤一：拉取镜像。相当于从网上下图纸和材料包
	// WithPullUnpack 表示下载完立刻解压准备使用
	image, err := e.client.Pull(e.ctx, imageName, containerd.WithPullUnpack)
	if err != nil {
		return fmt.Errorf("拉取失败: %w", err)
	}

	log.Printf("正在创建容器外壳 %s...\n", name)
	
	// 步骤二：创建容器外壳。相当于把材料组装成一台没通电的机器
	container, err := e.client.NewContainer(
		e.ctx,
		name, // 给这台机器起个名字
		containerd.WithImage(image), // 告诉它用刚才下的哪个材料包
		containerd.WithNewSnapshot(name+"-snapshot", image), // 给它一块独立的虚拟硬盘（快照）
		containerd.WithNewSpec(oci.WithImageConfig(image)),  // 按照材料包的默认说明书配置机器
	)
	if err != nil {
		return fmt.Errorf("创建容器失败: %w", err)
	}

	log.Printf("正在准备运行任务 %s...\n", name)
	
	// 步骤三：创建 Task。相当于给机器通电，准备按下开关
	// containerd.Stdio 表示把机器内部的屏幕输出（日志）接到我们当前的屏幕上
	task, err := container.NewTask(e.ctx, cio.NewCreator(cio.WithStdio))
	if err != nil {
		return fmt.Errorf("创建任务失败: %w", err)
	}

	log.Printf("启动服务 %s...\n", name)
	
	// 步骤四：真正启动！
	if err := task.Start(e.ctx); err != nil {
		return err
	}
	
	return nil // 一切顺利，没错误
}
```

最后是命令行入口,主程序就在这里

`./mini-compose-Neocmd/minicompose/main.go`

```go
// main 是 Go 语言程序的唯一入口，程序从这里开始执行
package main

import (
	"log"
	
	// 引入我们刚才自己写的两块积木
	"github.com/CacheTide/mini-compose-Neo/pkg/compose"
	"github.com/CacheTide/mini-compose-Neo/pkg/engine"
	
	// Cobra 是一个非常流行的用来写命令行工具的框架（Docker 也在用它）
	"github.com/spf13/cobra"
)

func main() {
	// 定义一个变量，用来保存用户输入的配置文件名
	var file string

	// 定义一个叫 "up" 的子命令（就跟 docker-compose up 一样）
	var upCmd = &cobra.Command{
		Use:   "up",                  // 用户在终端敲的词
		Short: "启动所有配置的服务",    // 帮助说明
		
		// Run 就是当用户敲下回车后，真正执行的逻辑
		Run: func(cmd *cobra.Command, args []string) {
			
			// 1. 调用第一块积木：解析图纸
			proj, err := compose.Parse(file)
			if err != nil {
				log.Fatalf("解析配置文件失败: %v", err) // 打印错误并强制退出程序
			}

			// 2. 调用第二块积木：连接 containerd 包工头
			// "/run/containerd/containerd.sock" 是 Linux 上 containerd 默认的通信管道地址
			eng, err := engine.NewEngine("/run/containerd/containerd.sock")
			if err != nil {
				log.Fatalf("连接 containerd 失败: %v", err)
			}

			// 3. 遍历图纸里的每一个服务（比如 web, db）
			// for 循环会把 map 里的每一个名字(name)和具体配置(svc)拿出来处理
			for name, svc := range proj.Services {
				// 告诉包工头：给我跑这个服务！
				if err := eng.RunService(name, svc.Image); err != nil {
					log.Printf("运行服务 %s 失败: %v", name, err)
				}
			}
		},
	}

	// 给 "up" 命令增加一个可选参数 "-f" 或 "--file"
	// 如果用户不传，默认读取当前目录下的 "compose.yaml"
	upCmd.Flags().StringVarP(&file, "file", "f", "compose.yaml", "指定配置文件路径")

	// 定义程序的主命令（最高级别的命令）
	var rootCmd = &cobra.Command{Use: "minicompose"}
	
	// 把 "up" 命令挂载到主命令下面
	rootCmd.AddCommand(upCmd)
	
	// 让程序开始监听用户的命令行输入并执行！
	rootCmd.Execute()
}
```

然后是**makefile**放在根目录

```makefile
.PHONY: build test clean

BINARY_NAME=minicomposeneo

build:
	go build -o bin/$(BINARY_NAME) ./cmd/minicomposeneo

test:
	go test -v ./...

clean:
	rm -rf bin/
```

**GitHub Actions**

`./mini-compose-Neocmd/.github/workflows/ci.yml`

```
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    - name: Build
      run: make build
    - name: Test
      run: make test
```

Git

```bash
git init
git add .
git commit -m "feat: initial commit with basic containerd orchestration"
git branch -M main
git remote add origin git@github.com:CacheTide/mini-compose-Neo.git
git push -u origin main
```

目前就先做到这样子交作业了，特别感谢牛奶猫布置作业带我找方向，但是我依旧借助了很多ai去读代码写代码，最后这个项目我打算一段时间后继续去修改，至少要像个现代化的玩意，然后能跑，以及读一下依赖项目怎么使用
