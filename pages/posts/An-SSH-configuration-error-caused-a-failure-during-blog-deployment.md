---
title: ssh配置错误导致博客部署时报错
tags:
  - hexo
  - blog
date: 2025-01-12 17:27:42
categories: [技术]
cover: https://www.cachetide.top/cywl.jpg
---

最近写好博客要部署的时候莫名其妙一直报错

```
Please make sure you have the correct access rights
and the repository exists.
FATAL Something's wrong. Maybe you can find the solution here: https://hexo.io/docs/troubleshooting.html
Error: Spawn failed
    at ChildProcess.<anonymous> (C:\Users\Yiur\Desktop\yiurblog\node_modules\hexo-util\lib\spawn.js:51:21)
    at ChildProcess.emit (node:events:519:28)
    at cp.emit (C:\Users\Yiur\Desktop\yiurblog\node_modules\cross-spawn\lib\enoent.js:34:29)
    at ChildProcess._handle.onexit (node:internal/child_process:294:12)
```

自己查了一下发现可能是文件权限、依赖未安装、Git配置问题这些

根据自己以前犯过的错误，怀疑是部署未完成时修改文件导致，于是删除了.deploy_git文件夹

然后使用

```
git config --global core.autocrlf false
```

但是还是报错

之后怀疑时ssh配置问题，检查了config.yml文件里面的

```
deploy:

type: git

repo:  git@github.com:username/username.github.io.git

branch: master
```

也是正常的

之后意识到可能是电脑的ssh密钥问题，在github上查看settings-SSH and GPG keys-SSH keys-Authentication keys发现密钥没有正常链接

使用git尝试链接并且打印日志

```
ssh -vT git@github.com
```

以下是报错信息

```
OpenSSH_9.8p1, OpenSSL 3.2.2 4 Jun 2024
debug1: Reading configuration data /c/Users/Yiur/.ssh/config
debug1: /c/Users/Yiur/.ssh/config line 1: Applying options for github.com
/c/Users/Yiur/.ssh/config line 3: Bad port 'uesrname/uesrname.github.io.git'.
/c/Users/Yiur/.ssh/config: terminating, 1 bad configuration options
```

看到了自己朋友的username，才想起上次尝试在vscode远程控制她的仓库的事情，估计就是这时候做了点神人操作导致的

日志说的很明显了，打开/c/Users/Yiur/.ssh/config，修改内容为

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa
```

然后再使用

```
ssh -T git@github.com
```

出现了

```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

再使用 `hexo d` 成功部署

