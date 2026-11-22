/** Aircraft glTF axes: +X nose, +Y up, +Z right. Viewing adjustment, not a certified eye point. */
export function cockpitViewOffset(position,rear=0,height=0){
 if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))throw Error('Invalid cockpit eye position');
 const back=Number.isFinite(Number(rear))?Math.max(0,Math.min(.8,Number(rear))):0;
 const lift=Number.isFinite(Number(height))?Math.max(-.1,Math.min(.3,Number(height))):0;
 return {modelPosition:[-position[0]+back,-position[1]-lift,-position[2]],eyeHeight:position[1]+lift,rear:back,height:lift};
}
