import * as THREE from '../node_modules/three/build/three.module.js';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js'; //import map 사용해야 사용이 가능하다
import {TRIANGULATION} from './triangulation.js';

import {Line2} from '../node_modules/three/examples/jsm/lines/Line2.js';
import {LineMaterial} from '../node_modules/three/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from '../node_modules/three/examples/jsm/lines/LineGeometry.js';

const renderer = new THREE.WebGLRenderer();
const renderer_w = 680 
const renderer_h = 480
renderer.setSize( renderer_w, renderer_h );  
renderer.setViewport(0,0,renderer_w, renderer_h); 
document.body.appendChild( renderer.domElement );

const renderer2 = new THREE.WebGLRenderer();
const renderer2_w = 680 
const renderer2_h = 480
renderer2.setSize( renderer2_w, renderer2_h );  
renderer2.setViewport(0,0,renderer2_w, renderer2_h); 
document.body.appendChild( renderer2.domElement );


const camera_ar = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 30, 300 ); // projection transform
camera_ar.position.set( 0, 0, 100);
camera_ar.lookAt( 0, 0, 0 );
camera_ar.up.set(0,1,0);

const camera_ar2 = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); // projection transform
camera_ar2.position.set( 100, 100, 200);
camera_ar2.lookAt( 0, 0, 0 );
camera_ar2.up.set(0,1,0);



const videoElement = document.getElementsByClassName('input_video')[0];
// const canvasElement = document.getElementsByClassName('output_canvas')[0];
// const canvasCtx = canvasElement.getContext('2d');

const scene = new THREE.Scene();
const texture_bg = new THREE.VideoTexture(videoElement);
scene.background = texture_bg;

const light = new THREE.DirectionalLight(0xffffff , 1.5);
const amb_light = new THREE.AmbientLight(0xffffff , 0.5);


let SS_init = new THREE.Vector3();
let PS_init = SS_init.set((0/window.innerWidth)*2-1,-(0/window.innerHeight)*2+1,-1);//SS to PS
let np_init = PS_init.unproject(camera_ar)

light.position.set(np_init.x,np_init.y,np_init.z); //vec를 input으로 안받기 때문에 이런식으로
scene.add(light)
scene.add(amb_light)


//추가
const controls = new OrbitControls(camera_ar2 ,renderer2.domElement );
controls.target.set(0,5,0)
controls.update();

const cameraHelper = new THREE.CameraHelper(camera_ar);
scene.add(cameraHelper)

const lighthelper = new THREE.DirectionalLightHelper( light );
scene.add( lighthelper );


// //////////////////// 아직 해야함
// let bg = new THREE.CanvasTexture(results.image)
// const material_bg = new THREE.MeshBasicMaterial( { map: texture_bg} );
// const geometry = new THREE.PlaneGeometry(200,200);
// const mesh = new THREE.Mesh( geometry, material_bg );


// let a = new THREE.Vector3(0,0,camera_ar.far)
// //let b = a.unproject(camera_ar)

// let b = camera_ar.localToWorld(a)
// mesh.position.set(0,0, -b.z+ 200)
// scene.add(mesh)
// /////////////////



let oval_point_mesh = null 
//let oval_line = new THREE.Line()
let oval_line = new Line2()
let oval_line_geo = new LineGeometry()
let face_mesh_js = null //not facemesh from midpipe
let mesh = new THREE.Mesh();

function ProjScale(p_ms, cam_pos, src_d, dst_d){
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos)
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d))
}


function onResults2(results) {

    
    let aa = new THREE.Vector3(0,0,camera_ar.position.z - camera_ar.far)
    let ba = camera_ar.localToWorld(aa)
    console.log(ba)
    // console.log(camera_ar.near)

  // canvasCtx.save();
  // canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  // canvasCtx.drawImage(
  //     results.image, 0, 0, canvasElement.width, canvasElement.height); //image로 부터 texture가지고 오기
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      //landmark is nomalizedLandmark[] >> NDC에서의 값
      /*
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
      */
      //FACEMESH_FACE_OVAL, landmark 로 구현
      if(oval_point_mesh == null){
        let oval_point_geo= new THREE.BufferGeometry(); //강의 보삼
        
        //let oval_line_geo = new THREE.BufferGeometry();
        //let oval_line_geo = new LineGeometry();        
	
        let face_geo =  new THREE.BufferGeometry();
        const num_oval_points = FACEMESH_FACE_OVAL.length;
        const oval_vertices = []

        for(let i = 0 ;i< num_oval_points;i++){
          const index = FACEMESH_FACE_OVAL[i][0];
          const pos_ns = landmarks[index];
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
          //if(i == 0){console.log(pos_ns);}
          oval_vertices.push(pos_ws.x,pos_ws.y,pos_ws.z);
        }
        const oval_point_mat = new THREE.PointsMaterial({color: 0xFF0000, size:1});
        oval_point_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices , 3))
        oval_point_mesh = new THREE.Points(oval_point_geo,oval_point_mat);        
 
        //const oval_line_mat =  new THREE.LineBasicMaterial( { color: 0xFF0000 } );//my     
        let oval_line_mat =  new LineMaterial( { 
        	color: 0xffff00,
          linewidth: 1 , 
          dashed: false} );//my     
        
        oval_vertices.push(oval_vertices[0] , oval_vertices[1], oval_vertices[2] )
        //oval_line_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices, 3)) //point *3 size필요
        oval_line_geo.setPositions(oval_vertices)
        oval_line_mat.resolution.set(window.innerWidth , window.innerHeight );

        //oval_line = new THREE.Line(oval_line_geo , oval_line_mat) //my
        oval_line = new Line2(oval_line_geo , oval_line_mat)
        
        let face_mat = new THREE.MeshPhongMaterial({color : 0xFFFFFF , specular: new THREE.Color(0,0,0), shinness : 1000})
        face_mesh_js = new THREE.Mesh(face_geo , face_mat) 
        face_mesh_js.geometry.setIndex(TRIANGULATION) 

        face_geo.setAttribute('position', new THREE.Float32BufferAttribute(landmarks.length*3, 3)) 
        face_geo.setAttribute('normal', new THREE.Float32BufferAttribute(landmarks.length*3, 3))
        face_geo.setAttribute('uv', new THREE.Float32BufferAttribute(landmarks.length*2, 2))

        scene.add(oval_point_mesh);
        scene.add(oval_line);  //my
        scene.add(face_mesh_js);  //my
      }

      //000의 점을 역추산
      const p_c = new THREE.Vector3(0,0,0).unproject(camera_ar)
      const vec_cam2center = new THREE.Vector3().subVectors(p_c, camera_ar.position)
      const center_dist = vec_cam2center.length() //pdf a 값 

      //per frame
      const num_oval_points = FACEMESH_FACE_OVAL.length;
      //let positions = oval_line.geometry.attributes.position.array 
      let positions = []
      
      for(let i = 0 ;i< num_oval_points + 1;i++){
        let index
          if(i == num_oval_points){
            index =  FACEMESH_FACE_OVAL[0][0];
     
          }else{
            index = FACEMESH_FACE_OVAL[i][0];
          } //my

          const pos_ns = landmarks[index]; 
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);

          pos_ws = ProjScale(pos_ws , camera_ar.position, center_dist , 100.0)//100 b의 위치 on pdf

          // positions[3*i + 0] = pos_ws.x;
          // positions[3*i + 1] = pos_ws.y;
          // positions[3*i + 2] = pos_ws.z;

          positions.push(pos_ws.x , pos_ws.y,pos_ws.z)
      }
      oval_line_geo.setPositions(positions)
      oval_line.geometry.attributes.position.needsUpdate = true;


      let positions_p = oval_point_mesh.geometry.attributes.position.array 
      for(let i = 0 ;i< num_oval_points ;i++){
          let index = FACEMESH_FACE_OVAL[i][0];
          const pos_ns = landmarks[index]; 
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
  
          pos_ws = ProjScale(pos_ws , camera_ar.position, center_dist , 100.0)//100 b의 위치 on pdf
  
          positions_p[3*i + 0] = pos_ws.x;
          positions_p[3*i + 1] = pos_ws.y;
          positions_p[3*i + 2] = pos_ws.z;
      }

      oval_point_mesh.geometry.attributes.position.needsUpdate = true;
      //oval_line.geometry.attributes.position.needsUpdate = true;

      const num_points = landmarks.length;
      for(let i = 0 ;i< num_points ;i++){
        const pos_ns = landmarks[i];
        const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
        let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);

        pos_ws = ProjScale(pos_ws , camera_ar.position, center_dist , 100.0)//100 b의 위치 on pdf

        face_mesh_js.geometry.attributes.position.array[3*i + 0] = pos_ws.x;
        face_mesh_js.geometry.attributes.position.array[3*i + 1] = pos_ws.y;
        face_mesh_js.geometry.attributes.position.array[3*i + 2] = pos_ws.z;
        face_mesh_js.geometry.attributes.uv.array[2*i + 0] = pos_ns.x;
        face_mesh_js.geometry.attributes.uv.array[2*i + 1] = 1.0 - pos_ns.y

      }
      face_mesh_js.geometry.attributes.position.needsUpdate = true; 
      face_mesh_js.geometry.attributes.uv.needsUpdate = true; 
      face_mesh_js.geometry.computeVertexNormals();

      let texture_frame = new THREE.CanvasTexture(results.image) //texture from canvas
      face_mesh_js.material.map = texture_frame

      const material_bg = new THREE.MeshBasicMaterial( { map: texture_frame} );
      const geometry = new THREE.PlaneGeometry(100,100);
      mesh = new THREE.Mesh( geometry, material_bg );
      let a = new THREE.Vector3(0,0,camera_ar.far)
      //let b = a.unproject(camera_ar)
      let b = camera_ar.localToWorld(a)
      mesh.position.set(0,0, -b.z+ 200)
      console.log(mesh.position)
      scene.add(mesh)
    }
  }


  //////////////////// 아직 해야함
//   let bg = new THREE.CanvasTexture(results.image)
//   const material_bg = new THREE.MeshBasicMaterial( { map: bg} );
//   const geometry = new THREE.PlaneGeometry(100,100);
//   const mesh = new THREE.Mesh( geometry, material_bg );


//   let a = new THREE.Vector3(0,0,camera_ar.far)
//   //let b = a.unproject(camera_ar)

//   let b = camera_ar.localToWorld(a)
//   mesh.position.set(0,0, -b.z+ 200)
//   scene.add(mesh)
  /////////////////



  scene.background = texture_bg
  scene.remove(mesh)
  scene.remove(lighthelper)
  scene.remove(cameraHelper)
  renderer.render(scene, camera_ar)
  scene.background  = false
  
  scene.add(mesh)
  scene.add(lighthelper)
  scene.add(cameraHelper)
  renderer2.render(scene, camera_ar2)
  //canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `../node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1, //인식 사람수
  refineLandmarks: true, //iris(eye) tracking 
  minDetectionConfidence: 0.5, //너무 크게하면 confidence를 만족하는게 없어서 tacking을 안할수도있음
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults2); //callbackfunc 

// const camera = new Camera(videoElement, {
//   onFrame: async () => { //work every frame
//     await faceMesh.send({image: videoElement});
//   },
//   width: 1280,
//   height: 720
// });
//camera.start(); should not work for video

videoElement.play(); 

async function detectionFrame(){ //work every frame
    await faceMesh.send({image: videoElement});
    videoElement.requestVideoFrameCallback(detectionFrame)
}

videoElement.requestVideoFrameCallback(detectionFrame)

let mouse_click = false
manageEvent()

let SS = new THREE.Vector3();
let ws ;


function manageEvent(){
    renderer.domElement.addEventListener("wheel",mouseWheel,false);
    //renderer2.domElement.addEventListener("wheel",mouseWheel,false);
  
    renderer.domElement.addEventListener("mousedown", mouseDownHandler, false);
    renderer.domElement.addEventListener("mouseup", mouseUpHandler, false);
    
    renderer.domElement.addEventListener("mousemove", mouseMoveHandler, false);
    //renderer2.domElement.addEventListener("mouseUp",mouseUpHandler,false);
};

function mouseWheel(e){
  // canvasElement.matrixAutoUpdate = false;
  // canvasElement.matrixWorldNeedsUpdate = true;

  camera_ar.near += e.deltaY* 0.01;
  camera_ar.updateProjectionMatrix();
  let PS = SS.set((e.clientX/window.innerWidth)*2-1,-(e.clientY/window.innerHeight)*2+1,-1);//SS to PS
  let np = PS.unproject(camera_ar)
  ws = np

  console.log(ws)
  console.log(camera_ar.near)

  light.position.set(ws.x , ws.y , ws.z)
  console.log(light.position)

  cameraHelper.update();
  lighthelper.update();

//   ws.z = camera_ar.localToWorld(new THREE.Vector3(0,0,camera_ar.position.z - camera_ar.near)).z
} 


//mouseUpHandler
function mouseDownHandler(e){
    mouse_click = true
  }
  
function mouseUpHandler(e){
    mouse_click = false
  }
  

function mouseMoveHandler(e){
    if(mouse_click){
        
        let PS = SS.set((e.clientX/window.innerWidth)*2-1,-(e.clientY/window.innerHeight)*2+1,-1);//SS to PS
        let np = PS.unproject(camera_ar)
        ws = np

        console.log(ws)
        console.log(camera_ar.near)

        light.position.set(ws.x , ws.y , ws.z)
        console.log(light.position)

        cameraHelper.update();
        lighthelper.update();
    }
  
  }

  