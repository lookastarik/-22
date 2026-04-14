import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CustomLayerInterface, Map as MapLibreMap, MercatorCoordinate } from 'maplibre-gl';

export interface ProjectModel {
  id: string;
  name: string;
  url: string;
  coordinates: [number, number];
  altitude: number;
  rotation: number;
  scale: number;
  details: {
    cost: string;
    roi: string;
    status: string;
    description: string;
  };
}

export class ThreeProjectLayer implements CustomLayerInterface {
  id: string = 'investment-projects-layer';
  type: 'custom' = 'custom';
  renderingMode: '3d' = '3d';

  private map: MapLibreMap | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private loader: GLTFLoader;
  private projects: ProjectModel[];
  private onHover: (project: ProjectModel | null) => void;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private modelGroups: Map<string, THREE.Group> = new Map();

  constructor(projects: ProjectModel[], onHover: (project: ProjectModel | null) => void) {
    this.projects = projects;
    this.onHover = onHover;
    this.loader = new GLTFLoader();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext) {
    this.map = map;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });

    this.renderer.autoClear = false;

    // Add tactical lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(0, -70, 100).normalize();
    this.scene.add(directionalLight);

    // Load models
    this.projects.forEach((project) => {
      this.loader.load(project.url, (gltf) => {
        const model = gltf.scene;
        
        // Positioning
        const modelOrigin = MercatorCoordinate.fromLngLat(project.coordinates, project.altitude);
        const modelScale = modelOrigin.meterInMercatorCoordinateUnits();

        const group = new THREE.Group();
        group.add(model);
        
        // Apply transformations
        group.scale.set(modelScale * project.scale, modelScale * project.scale, modelScale * project.scale);
        group.rotation.x = Math.PI / 2;
        group.rotation.y = project.rotation;
        
        // Position in mercator space
        group.position.set(modelOrigin.x, modelOrigin.y, modelOrigin.z || 0);

        // Add wireframe effect for tactical look
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.project = project;
            child.userData.originalMaterial = child.material;
            
            // Create a tactical wireframe overlay
            const wireframeGeom = new THREE.WireframeGeometry(child.geometry);
            const wireframeMat = new THREE.LineBasicMaterial({ 
              color: 0x00ffff, 
              transparent: true, 
              opacity: 0.3,
              blending: THREE.AdditiveBlending
            });
            const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
            child.add(wireframe);
          }
        });

        this.scene?.add(group);
        this.modelGroups.set(project.id, group);
      }, undefined, (error) => {
        console.error(`Error loading model for project ${project.name}:`, error);
        // Fallback: Create a tactical box if model fails
        this.createFallbackModel(project);
      });
    });

    // Add event listener for raycasting
    map.on('mousemove', this.handleMouseMove.bind(this));
  }

  private createFallbackModel(project: ProjectModel) {
    const modelOrigin = MercatorCoordinate.fromLngLat(project.coordinates, project.altitude);
    const modelScale = modelOrigin.meterInMercatorCoordinateUnits();

    const geometry = new THREE.BoxGeometry(20, 20, 100);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.6,
      emissive: 0x003333
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.project = project;

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
    );
    mesh.add(wireframe);

    const group = new THREE.Group();
    group.add(mesh);
    group.scale.set(modelScale, modelScale, modelScale);
    group.rotation.x = Math.PI / 2;
    group.position.set(modelOrigin.x, modelOrigin.y, modelOrigin.z || 0);

    this.scene?.add(group);
    this.modelGroups.set(project.id, group);
  }

  private handleMouseMove(e: any) {
    if (!this.map || !this.scene || !this.camera) return;

    // Convert mouse position to normalized device coordinates (-1 to +1)
    const canvas = this.map.getCanvas();
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((e.point.x) / rect.width) * 2 - 1;
    this.mouse.y = -((e.point.y) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      let projectFound = null;
      for (const intersect of intersects) {
        if (intersect.object.userData.project) {
          projectFound = intersect.object.userData.project;
          break;
        }
        if (intersect.object.parent?.userData.project) {
          projectFound = intersect.object.parent.userData.project;
          break;
        }
      }
      this.onHover(projectFound);
      
      // Visual feedback on hover
      this.projects.forEach(p => {
        const group = this.modelGroups.get(p.id);
        if (group) {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (p.id === projectFound?.id) {
                (child.material as THREE.MeshPhongMaterial).emissive?.setHex(0x00ffff);
                (child.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
              } else {
                (child.material as THREE.MeshPhongMaterial).emissive?.setHex(0x000000);
                (child.material as THREE.MeshPhongMaterial).emissiveIntensity = 0;
              }
            }
          });
        }
      });
    } else {
      this.onHover(null);
      this.projects.forEach(p => {
        const group = this.modelGroups.get(p.id);
        if (group) {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              (child.material as THREE.MeshPhongMaterial).emissive?.setHex(0x000000);
              (child.material as THREE.MeshPhongMaterial).emissiveIntensity = 0;
            }
          });
        }
      });
    }
  }

  render(gl: WebGLRenderingContext, options: any) {
    if (!this.renderer || !this.scene || !this.camera) return;

    const m = new THREE.Matrix4().fromArray(options.matrix);
    this.camera.projectionMatrix = m;
    
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map?.triggerRepaint();
  }
}
