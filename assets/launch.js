//
// api: https://developers.weixin.qq.com/minigame/dev/document/open-api/data/wx.getUserInfo.html
//
cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        prefab: cc.Prefab,
        selfBlock:cc.Node,
        map:[],
        score:[],
    },

    start () {

        if (typeof wx === 'undefined') {
            return;
        }

        wx.onMessage( data => {
            if (data.message) {
                console.log(data.message);
            }
        });

        this.map = new Map();
        this.score = [];
        

        this.initUserInfo();
        this.initFriendInfo();

/*         this.score.sort();
        this.sortMap(); */
    },

    initUserInfo () {
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            lang: 'zh_CN',
            success: (res) => {
                //this.getRankData(res.data);
                this.showUserRank(res.data[0]);
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
                for (let i = 0; i < res.data.length; ++i) {
                    //this.getRankData(res.data[i]);
                    this.createUserBlock(res.data[i]);
                }
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    getRankData(data){
        let KVData = data.KVDataList;
        KVData.forEach(element => {
            if(element.key == "rank_1"){
                let k = element.value + "_" + data.nickName;
                this.map.set(k, data);
                this.score.push(parseInt(element.value));
            }
        });
    },

    /**排序字典 */
    sortMap(){
        let rankdata = []
        this.map.forEach(v, k => {
            let kk = parseInt(k.splice('_')[0]);
            while(rankdata[this.score.indexOf(kk)] != null){
                kk++
            }
            rankdata[kk] = v;
        });
    },

    showUserRank(user){
        let userName = this.selfBlock.getChildByName('userName').getComponent(cc.Label);
        userName.string = user.nickName || user.nickname;

        cc.loader.load({url: user.avatarUrl, type: 'png'}, (err, texture) => {
            if (err) console.error(err);
            let userIcon = this.selfBlock.getChildByName('avatar').children[0].getComponent(cc.Sprite);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
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
    }

});
