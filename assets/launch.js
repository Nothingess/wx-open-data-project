//
// api: https://developers.weixin.qq.com/minigame/dev/document/open-api/data/wx.getUserInfo.html
//
cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        prefab: cc.Prefab,
        selfBlock: cc.Node,
        loadPng: cc.Node,

        rankItems: {
            default: [],
            type: [cc.Texture2D]
        },

        rankIcon: {
            default: [],
            type: [cc.Texture2D]
        },

        _selfData: null,
        _selfOpenId: 0,
        _currUserScore_lv1: 0,           //第一关分数
        _currUserScore_lv2: 0,           //第二关分数
        _currUserScore_lv3: 0,           //第三关分数
        _currUserScore_lv4: 0,           //第四关分数

        _updateTimer: 0,

        _isShowMasking: false
    },

    start() {

        if (typeof wx === 'undefined') {
            return;
        }

        wx.onMessage(data => {
            if (!!data) {
                switch (data.k) {
                    case "rank_1":
                    case "rank_2":
                    case "rank_3":
                    case "rank_4":
                        this.uploadScore(data);
                        break;
                    case "openid":
                        this._selfOpenId = data.v;
                        break;
                    case "update":
                        this.showLoading();
                        this.updateRank("rank_1", 1);
                        this.selfBlock.getChildByName('me').active = false;
                        break;
                    case "s_1":
                        this.showLoading();
                        this.updateRank("rank_1", 1);
                        this.selfBlock.getChildByName('me').active = false;
                        break;
                    case "s_2":
                        this.showLoading();
                        this.updateRank("rank_2", 1);
                        this.selfBlock.getChildByName('me').active = false;
                        break;
                    case "s_3":
                        this.showLoading();
                        this.updateRank("rank_3", 1);
                        this.selfBlock.getChildByName('me').active = false;
                        break;
                    case "s_4":
                        this.showLoading();
                        this.updateRank("rank_4", 1);
                        this.selfBlock.getChildByName('me').active = false;
                        break;
                }
            }
        });

        this.initUserInfo("rank_1", false);
    },
    /**上传分数 */
    uploadScore(data) {
        let kvData = [{ key: data.k, value: data.v }]
        this.setUserCloudStorage(kvData);
    },


    initUserInfo(rank, isShow = true) {
        wx.getUserCloudStorage({
            keyList: ["rank_1", "rank_2", "rank_3", "rank_4"],
            success: (res) => {
                this._selfData = res.KVDataList;
                wx.getUserInfo({
                    openIdList: ['selfOpenId'],
                    lang: 'zh_CN',
                    success: (res) => {
                        this.showUserRank(res.data[0], rank);
                        if (isShow)
                            this.initFriendInfo(rank);
                    },
                    fail: (res) => {
                        console.error(res);
                    }
                });
            },
            fail: () => {
                this.initUserInfo(rank);
            }
        })
    },

    initFriendInfo(rank) {
        wx.getFriendCloudStorage({
            keyList: ["rank_1", "rank_2", "rank_3", "rank_4"],
            success: (res) => {
                this.showFriendRank(this.sortList(res.data, rank), rank);
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    showUserRank(user, rank) {
        let self = this;
        let userName = this.selfBlock.getChildByName('userName').getComponent(cc.Label);
        let nameStr = user.nickName || user.nickname;
        userName.string = nameStr;
        //this._selfOpenId = user.openId;
        cc.loader.load({ url: user.avatarUrl, type: 'png' }, (err, texture) => {
            if (err) console.error(err);
            let userIcon = self.selfBlock.getChildByName('avatar').children[0].getComponent(cc.Sprite);
            let scoreLa = self.selfBlock.getChildByName("score").getComponent(cc.Label);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
            if (self._selfData != null) {
                self._selfData.forEach(element => {
                    if (element.key == rank) {
                        scoreLa.string = element.value;
                    }
                    if (element.key == "rank_1") {
                        self._currUserScore_lv1 = parseInt(element.value);
                    } else if (element.key == "rank_2") {
                        self._currUserScore_lv2 = parseInt(element.value);
                    } else if (element.key == "rank_3") {
                        self._currUserScore_lv3 = parseInt(element.value);
                    } else {
                        self._currUserScore_lv4 = parseInt(element.value);
                    }
                });
            }
        });
    },

    createUserBlock(user) {
        let node = cc.instantiate(this.prefab);
        node.parent = this.content;
        node.x = 0;

        // set nickName
        let userName = node.getChildByName('userName').getComponent(cc.Label);
        userName.string = user.nickName || user.nickname;

        // set avatar
        cc.loader.load({ url: user.avatarUrl, type: 'png' }, (err, texture) => {
            if (err) console.error(err);
            let userIcon = node.getChildByName('avatar').children[0].getComponent(cc.Sprite);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
        });
    },

    showFriendRank(rankData, rankStr) {
        this.content.removeAllChildren();
        let rank = 1;
        rankData.forEach(element => {
            let node = cc.instantiate(this.prefab);
            node.parent = this.content;
            node.x = 0;

            // set nickName
            let userName = node.getChildByName('userName').getComponent(cc.Label);
            /*             let nameStr = element.nickName || element.nickname;
                        userName.string = `${nameStr.length > 6?nameStr.substring(0, 6) + "...":nameStr}`; */
            userName.string = element.nickName || element.nickname;

            // set avatar
            cc.loader.load({ url: element.avatarUrl, type: 'png' }, (err, texture) => {
                if (err) console.error(err);

                let userIcon = node.getChildByName('avatar').children[0].getComponent(cc.Sprite);
                userIcon.spriteFrame = new cc.SpriteFrame(texture);
            });

            let ranking = node.getChildByName("ranking");
            let scoreLa = node.getChildByName("score").getComponent(cc.Label);
            let suffix = (rank == 1) ? "st" : (rank == 2 ? "nd" : (rank == 3) ? "rd" : "");
            let rankingStr = "";
            rankingStr = `${rank}${suffix}`;
            let spCom = null;
            if (rank == 1) {
                ranking.removeComponent(cc.Label);
                spCom = new cc.SpriteFrame(this.rankIcon[0])
                ranking.addComponent(cc.Sprite).spriteFrame = spCom;
            } else if (rank == 2) {
                ranking.removeComponent(cc.Label);
                spCom = new cc.SpriteFrame(this.rankIcon[1])
                ranking.addComponent(cc.Sprite).spriteFrame = spCom;
            } else if (rank == 3) {
                ranking.removeComponent(cc.Label);
                spCom = new cc.SpriteFrame(this.rankIcon[2])
                ranking.addComponent(cc.Sprite).spriteFrame = spCom;
            } else {
                ranking.getComponent(cc.Label).string = rankingStr;
            }

            node.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.rankItems[(rank - 1) % 2]);


            if (element.openid == this._selfOpenId) {//玩家本身
                this.setSelfRank(rankingStr, spCom)
                console.log("设置自身排名成功！");
            }
            element.KVDataList.forEach(e => {
                if (e.key == rankStr) {
                    scoreLa.string = e.value;
                }
            });
            rank++;
        });
        this.hideLoading();
    },

    /**设置玩家排名 */
    setSelfRank(val, spCom) {
        let rankNode = this.selfBlock.getChildByName('ranking');
        let sprite = rankNode.getComponentInChildren(cc.Sprite);
        if (spCom) {
            rankNode.getComponent(cc.Label).string = '';
            sprite.enabled = true;
            sprite.spriteFrame = spCom;
        } else {
            rankNode.getComponent(cc.Label).string = val;
            sprite.enabled = false;
        }
    },
    /**上传分数 */
    setUserCloudStorage(list) {
        if (!this.isMaxScore(list[0].key, list[0].value)) {
            console.log("不是历史最高分", list[0].value);
            return;
        }
        wx.setUserCloudStorage({
            KVDataList: list,
            success: () => {
                console.log("上传数据成功！")
            },
            fail: () => {
                console.log("上传数据失败！")
            }
        })
    },
    /**当前分数是否是历史最高分数 */
    isMaxScore(rank, score) {
        if (rank == "rank_1") {
            if (this._currUserScore_lv1 <= 0) return true;
            if (this._currUserScore_lv1 < score) return true;
            return false;
        } else if (rank == "rank_2") {
            if (this._currUserScore_lv2 <= 0) return true;
            if (this._currUserScore_lv2 < score) return true;
            return false;
        } else if (rank == "rank_3") {
            if (this._currUserScore_lv3 <= 0) return true;
            if (this._currUserScore_lv3 < score) return true;
            return false;
        } else if (rank == "rank_4") {
            if (this._currUserScore_lv4 <= 0) return true;
            if (this._currUserScore_lv4 < score) return true;
            return false;
        }

    },

    /**刷新排行榜 */
    updateRank(rank = "s_1", change = 0) {
        /*         this._updateTimer = change;
                if (this._updateTimer <= 0) {
                    this._updateTimer++;
                    return;
                } */
        this.initUserInfo(rank);
    },

    sortList: function (ListData, rank, order) { //排序(ListData：res.data; rank:哪个榜；order:false降序，true升序)
        ListData.sort(function (a, b) {
            var AMaxScore = 0;
            var KVDataList = a.KVDataList;
            for (var i = 0; i < KVDataList.length; i++) {
                if (KVDataList[i].key == rank) {
                    AMaxScore = KVDataList[i].value;
                }
            }

            var BMaxScore = 0;
            KVDataList = b.KVDataList;
            for (var i = 0; i < KVDataList.length; i++) {
                if (KVDataList[i].key == rank) {
                    BMaxScore = KVDataList[i].value;
                }
            }

            if (order) {
                return parseInt(AMaxScore) - parseInt(BMaxScore);
            } else {
                return parseInt(BMaxScore) - parseInt(AMaxScore);
            }
        });
        return ListData;
    },

    showLoading() {
        if (this._isShowMasking) return;
        this.content.removeAllChildren();
        this.content.y = 0;
        this.selfBlock.active = false;
        this._isShowMasking = true;
        this.loadPng.active = true;
    },
    hideLoading() {
        if (!this._isShowMasking) return;
        this.loadPng.active = false;
        this._isShowMasking = false;
        this.selfBlock.active = true;
    }
});
