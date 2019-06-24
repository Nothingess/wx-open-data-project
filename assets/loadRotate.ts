
const {ccclass, property} = cc._decorator;

@ccclass
export class loadRotate extends cc.Component {

    update(dt):void{
        this.node.rotation += dt * 150;
    }
}
