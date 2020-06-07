<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class WebController extends AbstractController
{
    /**
     * @Route("/", name="app")
     */
    public function app()
    {
        return $this->render('web/app.html.twig');
    }
}
