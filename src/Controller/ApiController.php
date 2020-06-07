<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use \App\Entity\Photo;
use \App\Entity\Uzer;

class ApiController extends AbstractController
{
    /**
     * @Route("/api/user", methods={"GET"}, name="apiGetUser")
     */
    public function apiGetUser()
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles()))
        {
            return new JsonResponse([
                'error' => 'No tienes permiso'
            ]);
        }
        $uzers = [];
        $repository = $this->getDoctrine()->getRepository(Uzer::class);
        $res = $repository->findAllByLastseen();
        foreach ($res as $uzer)
        {
            $lastseen = '';
            if ($uzer->getLastseen()) $lastseen = $uzer->getDate()->format('Y-m-d');
            $currentUzer = [
                'id' => $uzer->getId(),
                'email' => $uzer->getEmail(),
                'roles' => $uzer->getRoles(),
                'name' => $uzer->getName(),
                'date' => $uzer->getDate()->format('Y-m-d'),
                'lastSeen' => $lastseen,
                'photos' => 0,
                'editions' => 0
            ];
            foreach ($uzer->getPhotos() as $photo)
            {
                $currentUzer['photos']++;
                if ($photo->getEdition()) $currentUzer['editions']++;
            }
            $uzers[] = $currentUzer;
        }
        return new JsonResponse([
            'error' => FALSE,
            'users' => $uzers
        ]);
    }

    /**
     * @Route("/api/user/me", methods={"GET"}, name="apiGetUserMe")
     */
    public function apiGetUserMe()
    {
        return new JsonResponse([
            'error' => FALSE,
            'user' => [
                'id' => $this->getUser()->getId(),
                'name' => $this->getUser()->getName(),
                'roles' => $this->getUser()->getRoles()
            ]
        ]);
    }

    /**
     * @Route("/api/user/{uid}", methods={"DELETE"}, name="apiDeleteUserId")
     */
    public function apiDeleteUserId($uid)
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles()))
        {
            return new JsonResponse([
                'error' => 'No tienes permiso'
            ]);
        }
        if(!is_numeric($uid))
        {
            return new JsonResponse([
                'error' => 'Usuario no encontrado'
            ]);
        }
        $repository = $this->getDoctrine()->getRepository(Uzer::class);
        $uzer = $repository->find($uid);
        if (!$uzer)
        {
            return new JsonResponse([
                'error' => 'Usuario no encontrado'
            ]);
        }
        foreach($uzer->getPhotos() as $photo)
        {
            $photoId = $photo->getId();
            unlink("../photos/big/${photoId}.jpg");
            unlink("../photos/small/${photoId}.jpg");
            $uzer->removePhoto($photo);
        }
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->remove($uzer);
        $entityManager->flush();
        return new JsonResponse([
            'error' => FALSE
        ]);
    }

    /**
     * @Route("/api/user/{uid}/gallery", methods={"GET"}, name="apiGetGallery")
     */
    public function apiGetGallery($uid)
    {
        if(!is_numeric($uid))
        {
            return new JsonResponse([
                'error' => 'Datos incorrectos'
            ]);
        }
        if ($uid != $this->getUser()->getId() && !in_array('ROLE_ADMIN', $this->getUser()->getRoles()))
        {
            return new JsonResponse([
                'error' => 'No tienes permiso'
            ]);
        }
        $repository = $this->getDoctrine()->getRepository(Uzer::class);
        $uzer = $repository->find($uid);
        $photos = $uzer->getPhotos();
        $photosArray = [];
        foreach ($photos as $photo)
        {
            $photosArray[] = [
                'id' => $photo->getId(),
                'edition' => $photo->getEdition()
            ];
        }
        return new JsonResponse([
            'error' => FALSE,
            'photos' => $photosArray
        ]);
    }

    /**
     * @Route("/api/photo/{pid}/img/{size}", methods={"GET"}, name="apiGetImg")
     */
    public function apiGetImg($pid, $size)
    {
        if(!is_numeric($pid) || ($size !== 'big' && $size !== 'small'))
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        $repository = $this->getDoctrine()->getRepository(Photo::class);
        $photo = $repository->find($pid);
        if (!$photo)
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        if ($photo->getUzer() !== $this->getUser() && !in_array('ROLE_ADMIN', $this->getUser()->getRoles()))
        {
            return new JsonResponse([
                'error' => 'No tienes permisos'
            ]);
        }
        $file = "../photos/${size}/${pid}.jpg";
        return new BinaryFileResponse($file);
    }

    /**
     * @Route("/api/photo", methods={"POST"}, name="apiPostPhoto")
     */
    public function apiPostPhoto(Request $request)
    {
        $contentType = $request->headers->get('Content-Type');
        if ($contentType !== 'image/jpeg')
        {
            return new JsonResponse([
                'error' => 'Archivo inválido'
            ]);
        }

        $tempFile = tmpfile();
        $tempPath = stream_get_meta_data($tempFile)['uri'];
        $data = $request->getContent();
        file_put_contents($tempPath, $data);

        $mime = mime_content_type($tempPath);
        if ($mime !== 'image/jpeg')
        {
            return new JsonResponse([
                'error' => 'Archivo inválido'
            ]);
        }

        $photo = new Photo();
        $photo->setDate(new \DateTime());
        $uzer = $this->getUser();
        $uzer->addPhoto($photo);
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->persist($photo);
        $entityManager->flush();

        $pathBig = '../photos/big/';
        $pathSmall = '../photos/small/';
        if (!is_dir($pathBig))
        {
            mkdir($pathBig, 0777, TRUE);
        }
        if (!is_dir($pathSmall))
        {
            mkdir($pathSmall, 0777, TRUE);
        }

        $img = imagecreatefromjpeg($tempPath);
        $exif = exif_read_data($tempPath);
        if (!empty($exif['Orientation'])) {
            switch ($exif['Orientation']) {
                case 3:
                    $img = imagerotate($img, 180, 0);
                    break;
                case 6:
                    $img = imagerotate($img, -90, 0);
                    break;
                case 8:
                    $img = imagerotate($img, 90, 0);
                    break;
            }
        }
        $finalPathBig = $pathBig . $photo->getId() . '.jpg';
        imagejpeg($img, $finalPathBig);

        $imgWidth = imagesx($img);
        $imgHeight = imagesy($img);
        if ($imgWidth < $imgHeight)
        {
            $width = 200;
            $height = $width * $imgHeight / $imgWidth;
        }
        else {
            $height = 200;
            $width = $height * $imgWidth / $imgHeight;
        }
        $imgSmall = imagecreatetruecolor($width, $height);
        imagecopyresampled($imgSmall, $img, 0, 0, 0, 0,
                           $width, $height, $imgWidth, $imgHeight);
        $finalPathSmall = $pathSmall . $photo->getId() . '.jpg';
        imagejpeg($imgSmall, $finalPathSmall, 70);

        return new JsonResponse([
            'error' => FALSE,
            'photo' => [
                'id' => $photo->getId(),
                'edition' => $photo->getEdition()
            ]
        ]);
    }

    /**
     * @Route("/api/photo/{id}", methods={"DELETE"}, name="apiDeletePhoto")
     */
    public function apiDeletePhoto($id)
    {
        if(!is_numeric($id))
        {
            return new JsonResponse([
                'error' => 'Datos incorrectos'
            ]);
        }

        $repository = $this->getDoctrine()->getRepository(Photo::class);
        $photo = $repository->find($id);
        if (!$photo)
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        if ($photo->getUzer() !== $this->getUser() && !in_array('ROLE_ADMIN', $this->getUser()->getRoles()))
        {
            return new JsonResponse([
                'error' => 'No tienes permisos'
            ]);
        }

        unlink("../photos/big/${id}.jpg");
        unlink("../photos/small/${id}.jpg");

        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->remove($photo);
        $entityManager->flush();

        return new JsonResponse([
            'error' => FALSE
        ]);
    }

    /**
     * @Route("/api/photo/{id}/edition", methods={"PUT"}, name="apiPutPhotoEdition")
     */
    public function apiPutPhotoEdition($id, Request $request)
    {
        if (!is_numeric($id))
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        $repository = $this->getDoctrine()->getRepository(Photo::class);
        $photo = $repository->find($id);
        if (!$photo || $photo->getUzer() !== $this->getUser())
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        $dataJson = $request->getContent();
        $data = json_decode($dataJson, TRUE);
        $photo->setEdition($data);
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->persist($photo);
        $entityManager->flush();
        return new JsonResponse([
            'error' => FALSE
        ]);
    }

    /**
     * @Route("/api/photo/{id}/edition", methods={"GET"}, name="apiGetPhotoEdition")
     */
    public function apiGetPhotoEdition($id)
    {
        if (!is_numeric($id))
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        $repository = $this->getDoctrine()->getRepository(Photo::class);
        $photo = $repository->find($id);
        if (!$photo || $photo->getUzer() !== $this->getUser())
        {
            return new JsonResponse([
                'error' => 'Archivo no encontrado'
            ]);
        }
        return new JsonResponse([
            'error'   => FALSE,
            'edition' => $photo->getEdition()
        ]);
    }
}
