---
layout: post
title: YubiKey折腾笔记/gpg跑靓号
date: 2026-04-03 15:25:30
cover: https://www.cachetide.top/header3.jpg
categories: [技术]
tags: [gpg,yubikey]
---

*汐:“我买了一个100块钱实体密钥。”*

*misaka:”为什么不买yubico的，也100多。“*

*汐（看淘宝）:”670也叫100多？“*

*misaka:”我忘了我花的新西兰元了，那我送你一个。“*

于是我就这样得到了一个yubikey

# Yubico Authenticator

首先我们下载一个**Yubico Authenticator**，算是yubikey的管理器，在Authenticator上显示的三项功能主要是OTP(账户),Passkey(通行密钥),PIV(证书)以及solt(槽位)的设置

OTP就是用于2fa的动态码/一次性密码，总共可以导入64个账户

Passkey就是类似于1password存通行密钥那种，支持FIDO U2F和FIDO2~~（后文会提到这个）~~

PIV支持身份认证，数字签名，密钥管理以及卡片认证（一般是.pem,.der,.pfx,.p12,.key,.cr文件），PIN是解锁PIV的使用密码，而PUK是用于在PIN多次输错被上锁时解锁，如果PUK也无了只能重置。同时，相比于**Yubico Authenticator**可视化的证书，yubikey还有一个独立的可以存储gpg密钥的位置，可以使用gnupg这类工具进行配置

solt可以理解为给短触和长触配置功能，可以用于yubicoOTP,Challenge-response,Static password,OATH-HOTP

# GPG证书

## 制作gpg密钥

GPG密钥不会影响Yubico Authenticator显示的证书，是两个独立的功能

因为我想要特殊尾号的密钥（装b）所以先在 arch linux下跑一个密钥，先装需要的依赖（没有这种需求的可以跳到配置的地方）

```bash
sudo pacman -Syu
sudo pacman -S base-devel git cuda libgcrypt pkgconf
```

 Arch 的 `cuda` 默认安装在 `/opt/cuda`，有时候 `nvcc` 不在系统的环境变量 `$PATH` 里需要检查一下能否直接运行

```bash
nvcc --version
```

找不到命令，就需要把 CUDA 路径加进环境变量

```bash
export PATH=/opt/cuda/bin:$PATH
```

我们需要使用gpg-fingerprint-filter-gpu来撞出想要的gpg

```bash
git clone https://github.com/cuihaoleo/gpg-fingerprint-filter-gpu.git
cd gpg-fingerprint-filter-gpu
make
```

现在开始跑密钥

```bash
mkdir -p master_Key
./gpg-fingerprint-filter-gpu -m Y "6{12}" master_Key
```

根据实测，5090需要3~5小时，而4060桌面版大概跑了一天半（推荐使用tmux放后台慢慢跑）

每跑出来一个会提示，跑够了 `ctrl c`停止就是

安装gnupg

```bash
sudo pacman -S gnupg
```

现在把跑出来的文件导入进去

```bash
gpg  --import master_Key/*.gpg
```

然后查询主密钥KEYID记住（下文会用MASTERKEYID代替具体值）

```bash
gpg --list-secret-keys --keyid-format LONG
```

现在我们来跑子密钥靓号，一般推荐一个cv25519两个ed25519，实现**Sign (签名)**，**Encrypt (加密)**，**Authenticate (身份验证)**，然后主密钥冷保存用于**Certify (认证**）

```bash
./gpg-fingerprint-filter-gpu -a cv25519 "6{12}" subkey_cv
./gpg-fingerprint-filter-gpu -a ed25519 -m Y "6{12}" subkey_ed
```

`-m Y`用于找到一个就写一个文件，然后继续找下一个

跑出来后导入

```bash
gpg --allow-non-selfsigned-uid --import subkey_cv/*
gpg --allow-non-selfsigned-uid --import subkey_ed/*
```

现在我们要取出子密钥创建的时间戳，用来后面保持指纹不变

```bash
gpg -k --with-colons
```

大概会输出

```
pub:i:255:22:XXXX666666666666:123456789:::-:::sca:::::ed25519:::0:
fpr:::::::::XXXXXXXXXXXXXXXXXXXXXXXXXXXXX:
uid:-::::::XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX::NONAME::::::::::0:
```

上述123456789的位置就是时间戳，假设时间戳真的是123456789,指纹也真的是XXXX666666666666

然后我们查询Keygrip

```
gpg --with-keygrip -K XXXX666666666666
```

然后复制下来这个密钥的Keygrip

接下来我们开始导入

```bash
gpg --expert --faked-system-time="123456789!" --ignore-time-conflict --edit-key MASTERKEYID
```

现在我们计入了一个`gpg>`的交互界面

输入

```
addkey
```

选择`existing key`也可能是输入对应输入，这里我输入的是`13`对应的existing key，然后会提示输入Keygrip，把上文的复制下来输入即可

接下来会让你选择执行什么功能，cv25519只有Encrypt (加密)，ed25519只有Sign (签名)和Authenticate (身份验证)，建议两个ed25519各自选择一个

然后会有各种确认，一律y/yes过去，最后我们输入

```
save
```

这样这个子密钥就成功配置到主密钥下面了

## 导入yubikey

接下来是另外俩，配好好我们终于可以掏出yubikey了

> [!WARNING]
>
> 导入yubikey之前一定先备份一份，导入后gpg自动会删除电脑上私钥！！！

~~*是的，我踩坑了*~~

先装依赖

```bash
sudo pacman -Syu
sudo pacman -S gnupg scdaemon pcsclite ccid yubikey-manager
sudo systemctl enable --now pcscd
```

然后插上yubikey,先确认系统是否识别

```bash
gpg --card-status
```

然后我们需要更改yubikey的东西

```
gpg --card-edit
```

进入`gpg/card>`交互后

```
admin
key-attr
```

然后选择`ECC`，即`2`选项

然后会有三个槽位

1) 签名密钥（Signature slot）

然后在 ECC 选项里选：**Ed25519 / eddsa**（文字可能显示为 “Ed25519”“ED25519”“eddsa”“Curve 25519 (EdDSA)” 等，选带 *EdDSA/Ed25519* 的那个）

2) 加密密钥（Encryption slot）

ECC 选项里选：**Curve25519 (ECDH) / cv25519**（有时写 “Curve 25519”“X25519”“cv25519”“ECDH”）

3) 认证密钥（Authentication slot）

ECC 选项里选：**Ed25519 / eddsa**

我们需要最后`gpg --card-status`可以显示

```
Key attributes ...: eddsa cv25519 eddsa
```

修改好后，我们现在进入主密钥编辑

```bash
gpg --edit-key MASTERKEYID
```

然后我们需要一一对应放进yubikey，我假设带[S]的密钥是key 1

输入

```
key 1
```

现在选中的密钥上面有`*`提示

现在放入yubikey

```
keytocard
```

被问放在哪个槽位就按照之前的功能选，比如`Sign`

然后按照提示输入yubikey密码

执行完记得再次`key 1`来取消选择然后再搞`key 2`

执行完所有的后记得

```
save
```

## yubikey上证书的使用

我们可以用github提交进行sign,这样子会在提交旁边显示绿色 **"Verified"** 勋章，点开一看还是`XXXX666666666666`~~很帅好吧~~

由于我们可能更换设备使用，最好先导出导入公钥，尤其是win

先导出一份公钥，然后导入到另一个设备

```bash
gpg --import public.asc
```

然后看卡片状态并且验证

```bash
gpg --card-status
gpg -K --keyid-format LONG
```

接下来把公钥放在github上面

然后我们去设置git

```
git config --global user.signingkey XXXX666666666666
git config --global commit.gpgsign true
git config --global gpg.program gpg
```

~~（如果上面卡片状态正常这里报错，就是答辩win下面有各种gpg,巨容易冲突或者找不到路径），只能手动设置路径 `git config --global gpg.program "替换为你电脑上gpg路径"`~~

现在你`git commit -m "xxx"`的时候就会弹出对话框要求你输入 **YubiKey PIN**（并且 YubiKey 的指示灯会闪烁，你可能需要触摸一下它来确认）同时github上也会出现提交以验证

还可以用来加密文件

```
gpg --encrypt --recipient xxxx666666666666 --output sensitive-file.gpg my-document.txt
```

以及解密

```bash
gpg --decrypt sensitive-file.gpg > my-document-decrypted.txt
```

还可以gpg代理ssh(win别用，我眼泪都搞出来了还是各种gpg冲突)

编辑`~/.gnupg/gpg-agent.conf`添加

```
enable-ssh-support
```

然后在 `.bashrc` 或 `.zshrc` 加入

```bash
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
```

重启终端，执行 `ssh-add -L`，你会看到一行类似 `ssh-ed25519 xxxxx... cardno:1234567890`。这就是你 YubiKey 里的公钥，把它放到服务器的 `~/.ssh/authorized_keys` 即可登录。

# 关于通行密钥的一点提示

我不得不提到discord这坨屎

傻呗discord把2fa的安全密钥和passkey的通行密钥的按钮放在了一起，你要知道自己注册啥了只能f12看

它给yubikey默认U2F，但是1password又是FIDO2

所以注册后yubikey里面看不到东西，必须输入账号密码后验证登录，要不然不识别，但是1password能不要账号密码直接登录

解决方案是写脚本让注册密钥时候强制FIDO2以下是ai生成脚本

```
(function() {
    const originalCreate = navigator.credentials.create.bind(navigator.credentials);
    navigator.credentials.create = function(options) {
        if (options.publicKey) {
            // 强制要求生成常驻凭据 (Resident Key)
            options.publicKey.authenticatorSelection = options.publicKey.authenticatorSelection || {};
            options.publicKey.authenticatorSelection.residentKey = "required";
            options.publicKey.authenticatorSelection.requireResidentKey = true;
            
            // 强制要求用户验证 (触发 PIN 码输入)
            options.publicKey.authenticatorSelection.userVerification = "required";
            
            console.log("已强行修改 WebAuthn 注册参数为 [常驻凭据+必填PIN]：", options);
        }
        return originalCreate(options);
    };
    console.log("WebAuthn 强制脚本已激活，请现在点击 Discord 的“注册安全密钥”按钮。");
})();
```

f12放控制台用的

......别的好玩功能还在研究施工中