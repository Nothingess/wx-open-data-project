//
// api: https://developers.weixin.qq.com/minigame/dev/document/open-api/data/wx.getUserInfo.html
//
cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        prefab: cc.Prefab,
        selfBlock:cc.Node,

        rankItems:{
            default:[],
            type:[cc.Texture2D]
        },

        _selfData:null,
        _selfOpenId:0,
        _currUserScore_lv1:0,           //第一关分数
        _currUserScore_lv2:0,           //第二关分数
        _currUserScore_lv3:0            //第三关分数
    },

    start () {

        if (typeof wx === 'undefined') {
            return;
        }

        wx.onMessage( data => {
            if (!!data) {
                switch(data.k){
                    case "rank_1":
                    case "rank_2":
                    case "rank_3":
                        this.uploadScore(data);
                    break;
                    case "openid":
                    break;
                }
            }
        });

        this.initUserInfo();
    },
    /**上传分数 */
    uploadScore(data){
        let kvData = [{key:data.k, value:data.v}]
        this.setUserCloudStorage(kvData);
    },
    /**获取openid */
    getSelfOpenId(){

    },


    initUserInfo () {
        wx.getUserCloudStorage({
            keyList:["rank_1", "rank_2"],
            success:(res)=>{
                this._selfData = res.KVDataList;
            }
        })
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            lang: 'zh_CN',
            success: (res) => {
                this.showUserRank(res.data[0]);
                this.initFriendInfo();
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    initFriendInfo () {
        wx.getFriendCloudStorage({
            keyList:["rank_1", "rank_2"],
            success: (res) => {
                this.showFriendRank(this.sortList(res.data));
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    showUserRank(user){
        let self = this;
        let userName = this.selfBlock.getChildByName('userName').getComponent(cc.Label);
        userName.string = user.nickName || user.nickname;
        this._selfOpenId = user.openId;
        cc.loader.load({url: user.avatarUrl, type: 'png'}, (err, texture) => {
            if (err) console.error(err);
            let userIcon = self.selfBlock.getChildByName('avatar').children[0].getComponent(cc.Sprite);
            let scoreLa = self.selfBlock.getChildByName("score").getComponent(cc.Label);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
            if(self._selfData != null){
                self._selfData.forEach(element => {
                    if(element.key == "rank_1"){
                        scoreLa.string = element.value;
                        self._currUserScore_lv1 = parseInt(element.value);
                    }else if(element.key == "rank_2"){
                        self._currUserScore_lv2 = parseInt(element.value);
                    }else{
                        self._currUserScore_lv3 = parseInt(element.value);
                    }
                });
            }
        });
    },

    createUserBlock (user) {
        let node = cc.instantiate(this.prefab);
        node.parent = this.content;
        node.x = 0;

        // set nickName
        let userName = node.getChildByName('userName').getComponent(cc.Label);
        userName.string = user.nickName || user.nickname;

        // set avatar
        cc.loader.load({url: user.avatarUrl, type: 'png'}, (err, texture) => {
            if (err) console.error(err);
            let userIcon = node.getChildByName('avatar').children[0].getComponent(cc.Sprite);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
        });
    },

    showFriendRank(rankData){
        let rank = 1;
        rankData.forEach(element => {
            let node = cc.instantiate(this.prefab);
            node.parent = this.content;
            node.x = 0;
    
            // set nickName
            let userName = node.getChildByName('userName').getComponent(cc.Label);
            userName.string = element.nickName || element.nickname;
    
            // set avatar
            cc.loader.load({url: element.avatarUrl, type: 'png'}, (err, texture) => {
                if (err) console.error(err);

                let userIcon = node.getChildByName('avatar').children[0].getComponent(cc.Sprite);
                userIcon.spriteFrame = new cc.SpriteFrame(texture);
            });

            let rankingLa = node.getChildByName("ranking").getComponent(cc.Label);
            let scoreLa = node.getChildByName("score").getComponent(cc.Label);
            rankingLa.string = rank < 4?`${rank}st`:`${rank}`;
            node.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.rankItems[rank - 1]);

            if(element.openid == this._selfOpenId){//玩家本身
                this.setSelfRank(rankingLa.string)
            }
            element.KVDataList.forEach(e => {
                if(e.key == "rank_1"){
                    scoreLa.string = e.value;
                }
            });
            rank++;
        });
    },

    /**设置玩家排名 */
    setSelfRank(val){
        this.selfBlock.getChildByName('ranking').getComponent(cc.Label).string = val;
    },
    /**上传分数 */
    setUserCloudStorage(list){
        if(!this.isMaxScore(list[0].key, list[0].value)){
            console.log("不是历史最高分", list[0].value);
            return;
        }
        wx.setUserCloudStorage({
            KVDataList:list,
            success:()=>{
                console.log("上传数据成功！")
            },
            fail:()=>{
                console.log("上传数据失败！")
            }
        })
    },
    /**当前分数是否是历史最高分数 */
    isMaxScore(rank, score){
        if(rank == "rank_1"){
            if(this._currUserScore_lv1 <= 0)return true;
            if(this._currUserScore_lv1 < score)return true;
            return false;
        }else if(rank == "rank_2"){
            if(this._currUserScore_lv2 <= 0)return true;
            if(this._currUserScore_lv3 < score)return true;
            return false;
        }else if(rank == "rank_3"){
            if(this._currUserScore_lv3 <= 0)return true;
            if(this._currUserScore_lv4 < score)return true;
            return false;
        }

    },


    sortList: function(ListData, order){ //排序(ListData：res.data;order:false降序，true升序)
        ListData.sort(function(a,b){
            var AMaxScore = 0;
            var KVDataList = a.KVDataList;
            for(var i = 0; i < KVDataList.length; i++){
                if(KVDataList[i].key == "rank_1"){
                AMaxScore = KVDataList[i].value;
                }
            }
    
            var BMaxScore = 0;
            KVDataList = b.KVDataList;
            for(var i = 0; i<KVDataList.length; i++){
                if(KVDataList[i].key == "rank_1"){
                BMaxScore = KVDataList[i].value;
                }
            }

            if(order){
                return parseInt(AMaxScore) - parseInt(BMaxScore);
            }else{
                return parseInt(BMaxScore) - parseInt(AMaxScore);
            }
        });
        return ListData;
    }
});
