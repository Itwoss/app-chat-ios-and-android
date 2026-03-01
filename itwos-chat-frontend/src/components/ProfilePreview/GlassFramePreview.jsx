import { useEffect, useRef, useState } from 'react'
import { Box, Button, VStack, Text, Spinner, Center } from '@chakra-ui/react'
import { Upload } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

const GlassFramePreview = ({ profileImage, profileName, onImageUpload }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cleanup = () => {}
    let animationId = null

    try {
      // Parameters
      const params = {
        shape: 'Square',
        segments: 64,
        photoScale: 1.2,
        bg: '#050505',
        envMap: 'Royal Esplanade',
        glassColor: '#ffffff',
        envIntensity: 1.0,
        internalReflect: 1.5,
        opacity: 1.0,
        playing: true,
        globalSpeed: 1.0,
        yAxis: { mode: 'Spin', speed: 0.5, amp: 0.6 },
        xAxis: { enabled: true, speed: 0.4, amp: 0.2 },
        zAxis: { enabled: true, speed: 0.3, amp: 0.1 }
      }

      // Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(params.bg)

      const camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        100
      )
      camera.position.set(0, 0, 7)

      // iOS Safari: WebGL may not be supported or may fail to initialize
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        });
        
        // Verify WebGL context was created successfully
        if (!renderer.getContext()) {
          throw new Error('WebGL context not available');
        }
        
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
      } catch (error) {
        console.warn('[WebGL] Not supported on this device, disabling 3D preview:', error);
        // WebGL not available - disable 3D preview
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        return;
      }
      renderer.toneMappingExposure = 1.0
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      containerRef.current.appendChild(renderer.domElement)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.enablePan = false

      // Environment
      const hdriUrls = {
        'Royal Esplanade': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/royal_esplanade_2k.hdr',
        'Studio Small': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_03_2k.hdr',
        'Moonless Golf': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/moonless_golf_2k.hdr',
        'Overcast': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/zhgezhda_2k.hdr'
      }

      const rgbeLoader = new RGBELoader()

      function loadEnvironment(name) {
        rgbeLoader.load(
          hdriUrls[name],
          (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            scene.environment = texture
            scene.environmentIntensity = params.envIntensity
          },
          undefined,
          (error) => {
            console.warn('Failed to load environment map:', error)
            // Continue without environment map
          }
        )
      }

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
      scene.add(ambientLight)
      const backLight = new THREE.DirectionalLight(0xffffff, 3.0)
      backLight.position.set(-5, 2, -10)
      scene.add(backLight)
      const topLight = new THREE.DirectionalLight(0xffffff, 2.0)
      topLight.position.set(0, 10, 0)
      scene.add(topLight)
      const frontLight = new THREE.DirectionalLight(0xffffff, 1.0)
      frontLight.position.set(0, 2, 10)
      scene.add(frontLight)

      const group = new THREE.Group()
      scene.add(group)

      // Photo
      let currentAspectRatio = 1.0

      const photoGeo = new THREE.PlaneGeometry(1, 1)
      const photoMat = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
        transparent: false,
        alphaTest: 0.5,
        depthWrite: true
      })

      const photoMesh = new THREE.Mesh(photoGeo, photoMat)
      photoMesh.position.set(0, 0, 0)
      photoMesh.renderOrder = 0
      group.add(photoMesh)

      const textureLoader = new THREE.TextureLoader()

      function updatePhotoScale() {
        const s = params.photoScale
        let safeMargin = 1.0
        if (params.shape === 'Heart' || params.shape === 'Oval') {
          safeMargin = 0.9
        }
        const finalScale = s * safeMargin

        if (currentAspectRatio > 1) {
          photoMesh.scale.set(finalScale, finalScale / currentAspectRatio, 1)
        } else {
          photoMesh.scale.set(finalScale * currentAspectRatio, finalScale, 1)
        }
      }

      // Load profile image
      const imageUrl = profileImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop'
      textureLoader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          photoMat.map = tex
          photoMat.needsUpdate = true
          if (tex.image) {
            currentAspectRatio = tex.image.width / tex.image.height
            updatePhotoScale()
          }
          setIsLoading(false)
        },
        undefined,
        (error) => {
          console.error('Error loading image:', error)
          setIsLoading(false)
          setError('Failed to load image')
        }
      )

      // Geometry helpers
      function createSmoothShape(radiusX, radiusY, points = 128) {
        const shape = new THREE.Shape()
        const step = (Math.PI * 2) / points
        for (let i = 0; i < points; i++) {
          const angle = i * step
          const x = Math.cos(angle) * radiusX
          const y = Math.sin(angle) * radiusY
          if (i === 0) shape.moveTo(x, y)
          else shape.lineTo(x, y)
        }
        return shape
      }

      function createHeartShape() {
        const x = 0, y = 0
        const shape = new THREE.Shape()
        shape.moveTo(x + 0.5, y + 0.5)
        shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y)
        shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7)
        shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9)
        shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7)
        shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y)
        shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5)
        return shape
      }

      function createPolygonShape(sides, radius) {
        const shape = new THREE.Shape()
        const angleStep = (Math.PI * 2) / sides
        const offset = sides === 6 ? Math.PI / 2 : Math.PI / 8
        for (let i = 0; i < sides; i++) {
          const x = Math.cos(i * angleStep + offset) * radius
          const y = Math.sin(i * angleStep + offset) * radius
          if (i === 0) shape.moveTo(x, y)
          else shape.lineTo(x, y)
        }
        return shape
      }

      // Glass Material
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: params.glassColor,
        transmission: 1.0,
        opacity: params.opacity,
        metalness: 0.0,
        roughness: 0.0,
        ior: 1.5,
        thickness: 1.2,
        attenuationColor: 0xffffff,
        attenuationDistance: 9999.0,
        specularIntensity: 1.0,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })

      const glassMesh = new THREE.Mesh(new THREE.BufferGeometry(), glassMat)
      glassMesh.receiveShadow = false
      glassMesh.renderOrder = 1
      group.add(glassMesh)

      function updateGeometry() {
        if (glassMesh.geometry) glassMesh.geometry.dispose()

        let geo
        const type = params.shape
        const detail = params.segments

        const extrudeSettings = {
          depth: 1.0,
          bevelEnabled: true,
          bevelSegments: 8,
          steps: 2,
          bevelSize: 0.08,
          bevelThickness: 0.1,
          curveSegments: detail
        }

        switch (type) {
          case 'Square':
            geo = new RoundedBoxGeometry(2.1, 2.1, 1.0, 32, 0.25)
            break
          case 'Heart':
            geo = new THREE.ExtrudeGeometry(createHeartShape(), extrudeSettings)
            geo.center()
            geo.rotateZ(Math.PI)
            geo.scale(1.2, 1.2, 1)
            break
          case 'Circle':
            geo = new THREE.ExtrudeGeometry(createSmoothShape(1.1, 1.1, Math.max(detail, 64)), extrudeSettings)
            geo.center()
            break
          case 'Oval':
            geo = new THREE.ExtrudeGeometry(createSmoothShape(0.8, 1.3, Math.max(detail, 64)), extrudeSettings)
            geo.center()
            break
          case 'Hexagon (6)':
            geo = new THREE.ExtrudeGeometry(createPolygonShape(6, 1.2), extrudeSettings)
            geo.center()
            break
          case 'Octagon (8)':
            geo = new THREE.ExtrudeGeometry(createPolygonShape(8, 1.2), extrudeSettings)
            geo.center()
            break
        }
        glassMesh.geometry = geo
        updatePhotoScale()
      }

      // Initialize
      loadEnvironment('Royal Esplanade')
      updateGeometry()

      // Animation loop
      const clock = new THREE.Clock()
      let time = 0

      function animate() {
        animationId = requestAnimationFrame(animate)
        const delta = clock.getDelta()

        if (params.playing) {
          time += delta * params.globalSpeed

          if (params.yAxis.mode === 'Spin') {
            group.rotation.y += delta * params.yAxis.speed * params.globalSpeed
          } else {
            group.rotation.y = Math.sin(time * params.yAxis.speed) * params.yAxis.amp
          }

          if (params.xAxis.enabled) group.rotation.x = Math.cos(time * params.xAxis.speed) * params.xAxis.amp
          if (params.zAxis.enabled) group.rotation.z = Math.sin(time * params.zAxis.speed * 0.7) * params.zAxis.amp
        }

        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }
      window.addEventListener('resize', handleResize)

      // Store references for cleanup
      sceneRef.current = {
        scene,
        renderer,
        camera,
        controls,
        photoMat,
        textureLoader,
        photoMesh,
        glassMesh,
        glassMat,
        animationId
      }

      cleanup = () => {
        window.removeEventListener('resize', handleResize)
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        if (containerRef.current && renderer.domElement) {
          try {
            containerRef.current.removeChild(renderer.domElement)
          } catch (e) {
            // Element might already be removed
          }
        }
        renderer.dispose()
        if (photoMat.map) photoMat.map.dispose()
        photoMat.dispose()
        if (glassMesh.geometry) glassMesh.geometry.dispose()
        glassMat.dispose()
      }
    } catch (err) {
      console.error('Error initializing Three.js:', err)
      setError('Failed to initialize 3D preview')
      setIsLoading(false)
    }

    return () => {
      cleanup()
    }
  }, [profileImage])

  return (
    <VStack spacing={4} align="stretch" w="full">
      {profileName && (
        <Text fontSize="lg" fontWeight="bold" color="white" textAlign="center">
          {profileName}
        </Text>
      )}
      <Box
        ref={containerRef}
        w="full"
        h="400px"
        bg="rgba(0, 0, 0, 0.5)"
        borderRadius="12px"
        overflow="hidden"
        position="relative"
        sx={{
          '& canvas': {
            display: 'block',
            width: '100%',
            height: '100%',
          },
        }}
      >
        {isLoading && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={10}
          >
            <Center>
              <Spinner size="lg" color="white" />
            </Center>
          </Box>
        )}
        {error && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            color="white"
            zIndex={10}
            textAlign="center"
          >
            <Text>{error}</Text>
          </Box>
        )}
      </Box>
      {onImageUpload && (
        <Button
          leftIcon={<Upload size={16} />}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = (e) => {
              const file = e.target.files[0]
              if (file && onImageUpload) {
                onImageUpload(file)
              }
            }
            input.click()
          }}
          bgGradient="linear(to-r, #007AFF, #5856D6)"
          color="white"
          borderRadius="full"
          size="sm"
        >
          Upload Photo
        </Button>
      )}
    </VStack>
  )
}

export default GlassFramePreview
