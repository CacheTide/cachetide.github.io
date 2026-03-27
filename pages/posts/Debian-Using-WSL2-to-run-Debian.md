---
layout: post
title: 使用wsl2装载debian
tags: [Debian,wsl,windows,linux]
date: 2025-10-19 13:22:07
categories: [技术]
cover: https://www.cachetide.top/cywl.jpg
---

# 检查虚拟化技术是否开启   

 首先我们要按住`win+R`然后输入`cmd`打开命令行，输入

```
systeminfo
```

会看到

```
Hyper-V 要求:     虚拟机监视器模式扩展: 是
                  固件中已启用虚拟化: 是
                  二级地址转换: 是
                  数据执行保护可用: 是
```

这代表已经开启虚拟化技术，可以继续安装，如果电脑上安装过安卓模拟器或者VMware可能会显示

```
Hyper-V 要求:       已检测到虚拟机监控程序。将不显示 Hyper-V 所需的功能。
```

这是由于Windows系统中只能有一个虚拟机监控程序（Hypervisor）在运行时控制硬件虚拟化资源，当系统检测到其他虚拟机监控程序正在运行时，为了避免资源冲突和不稳定的情况，Windows会自动禁用Hyper-V的相关功能，因此“将不显示 hyper-v 所需的功能”

不过这样子显示意味着虚拟化技术大概是启用了的

# 基本设置

## 开启开发者模式

在windows中找到`设置-开发者设置（开发者选项）-开发人员模式`并打开，弹出的“使用开发人员功能”窗口选择`是`

## 开启“适用于Linux的Windows子系统”

找到`控制面板-程序和功能-启用或关闭Windows功能`，选中“适用于Linux的Windows子系统”，然后点击`确定`

完成后需要重新启动

# 安装Linux发行版

使用管理员模式运行PowerShell，输入

```
wsl.exe --list --online
```

查看可用发行版

（可能会提示需要更新，根据提示操作更新后在输入，更新时最好使用vpn）

选择上述发行版名字进行安装

```
wsl.exe --install [Distro]
```

*由于笔者要使用Debian这里使用`wsl.exe --install debian`安装Debian的发行包,直接使用`wsl --install`的话会默认安装Ubuntu*

安装成功后会提示

```
Enter new UNIX uesrname
```

和

```
Enter new UNIX password
```

这里是创建用户名和密码

完成后就直接进入wsl的页面了

# 设置wsl

重新进入cmd

输入

```
wsl --set-default-version 2
```

设置为WSL2

使用

```
wsl -l -v
```

确认wsl下的机器和wsl版本

如果显示为1，使用下述代码将机器设置为2

```
wsl --set-version <distro name> 2
```

完成后可以输入

```
wsl --distribution <Distribution Name> --user <User Name>·
```

启动wsl

如果启动默认发行版直接输入

```
wsl
```

即可

或者在搜索栏搜素Debian会出现快捷方式一样可以启用

如果要关闭wsl则输入

```
wsl --shutdown
```

# Linux网络问题

有些时候启动了可能会显示

```
wsl: 检测到 localhost 代理配置，但未镜像到 WSL。
NAT 模式下的 WSL 不支持 localhost 代理
```

这是我们在本地使用了代理导致

最新版本可以直接在win搜素框寻找到`wsl steting`

打开后在`网络-网络模式`选择为`Mirrored`

然后重启wsl即完成修改

当然，您也可以选择方案二

打开资源管理器，在`C:\Users\<your_username>`下创建一个名为`.wslconfig`的文件，使用记事本打开向里面写入

```
[experimental]
autoMemoryReclaim=gradual
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true
```

保存后重启wsl即可
