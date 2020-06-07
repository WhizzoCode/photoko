<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use App\Security\LoginAuthenticator;
use Symfony\Component\Security\Guard\GuardAuthenticatorHandler;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use App\Entity\Uzer;

class LoginController extends AbstractController
{
    /**
     * @Route("/login", name="login")
     */
    public function login (AuthenticationUtils $authenticationUtils, Request $request, UserPasswordEncoderInterface $encoder, \Swift_Mailer $mailer, UrlGeneratorInterface $urlGenerator): Response
    {
        if ($this->getUser()) {
            return new RedirectResponse($urlGenerator->generate('app'));
        }

        $view = $request->request->get('view');
        $name = NULL;
        $email = NULL;
        $error = NULL;

        if (!$view)
        {
            $view = 'login';
        }

        switch ($view) {
            case 'signup':
                $name = $request->request->get('name');
                $email = $request->request->get('email');
                $password = $request->request->get('password');
                if (empty($name) || empty($email) || empty($password)
                    || !preg_match('/^.+@.+\..+$/', $email))
                {
                    $error = 'Datos inválidos';
                }
                else
                {
                    $uzer = $this->getDoctrine()->getRepository(Uzer::class)
                                ->findOneBy(['email' => $email]);
                    if ($uzer)
                    {
                        $error = 'Este email ya existe';
                    }
                    else
                    {
                        $uzer = new Uzer();
                        $uzer->setEmail($email);
                        $uzer->setRoles(['ROLE_USER']);
                        $encPassword = $encoder->encodePassword($uzer, $password);
                        $uzer->setPassword($encPassword);
                        $uzer->setName($name);
                        $uzer->setDate(new \DateTime());
                        $uzer->setActive(FALSE);
                        $entityManager = $this->getDoctrine()->getManager();
                        $entityManager->persist($uzer);
                        $entityManager->flush();
                        $hash = hash('sha1', $email . 'photoko' . $name);
                        $confirmUrl = 'http://' . $_SERVER['HTTP_HOST']
                            . '/login/signup/' . urlencode($email) . '/' . $hash;
                        $message = (new \Swift_Message('Registro Photoko'))
                            ->setFrom('my@email.com')
                            ->setTo($email)
                            ->setBody(
                                $this->renderView('emails/registration.html.twig', [
                                    'name' => $name,
                                    'confirmUrl' => $confirmUrl
                                ]), 'text/html'
                            );
                        $mailer->send($message);
                        $view = 'signup2';
                    }
                }
                break;
            case 'recover':
                $email = $request->request->get('email');
                if (empty($email) || !preg_match('/^.+@.+\..+$/', $email))
                {
                    $error = 'Datos inválidos';
                }
                else
                {
                    $uzer = $this->getDoctrine()->getRepository(Uzer::class)
                                 ->findOneBy(['email' => $email]);
                    if (!$uzer)
                    {
                        $error = 'Este email no existe';
                    }
                    else
                    {
                        $name = $uzer->getName();
                        $hash = hash('sha1', $email . 'photoko' . $name);
                        $confirmUrl = 'http://' . $_SERVER['HTTP_HOST']
                            . '/login/recover/' . urlencode($email) . '/' . $hash;
                        $message = (new \Swift_Message('Recuperar contraseña Photoko'))
                            ->setFrom('my@email.com')
                            ->setTo($email)
                            ->setBody(
                                $this->renderView('emails/recover.html.twig', [
                                    'name' => $name,
                                    'recoverUrl' => $confirmUrl
                                ]), 'text/html'
                            );
                        $mailer->send($message);
                        $view = 'recover2';
                    }
                }
                break;
            default:
                $email = $authenticationUtils->getLastUsername();
                if ($authenticationUtils->getLastAuthenticationError())
                {
                    $error = 'Email o contraseña incorrectos';
                }
                break;
        }

        return $this->render('web/login.html.twig', [
            'view' => $view,
            'name' => $name,
            'email' => $email,
            'error' => $error
        ]);
    }

    /**
     * @Route("/login/signup/{email}/{hash}", name="signupConfirm")
     */
    public function signupConfirm ($email, $hash, LoginAuthenticator $authenticator, GuardAuthenticatorHandler $guardHandler, Request $request): Response
    {
        $view = NULL;
        $name = NULL;
        $email = urldecode($email);
        $error = NULL;

        $uzer = $this->getDoctrine()->getRepository(Uzer::class)
                     ->findOneBy(['email' => $email]);
        if (!$uzer)
        {
            $view = 'signup3fail';
            $error = 'Datos inválidos';
        }
        else
        {
            $hash2 = hash('sha1', $email . 'photoko' . $uzer->getName());
            if ($hash !== $hash2)
            {
                $view = 'signup3fail';
                $error = 'Datos inválidos';
            }
            else
            {
                if ($uzer->getActive() === FALSE)
                {
                    $uzer->setActive(TRUE);
                    $entityManager = $this->getDoctrine()->getManager();
                    $entityManager->persist($uzer);
                    $entityManager->flush();
                    $view = 'signup3';
                }
                else
                {
                    return $guardHandler->authenticateUserAndHandleSuccess(
                        $uzer,
                        $request,
                        $authenticator,
                        'main'
                    );
                }
            }
        }

        return $this->render('web/login.html.twig', [
            'view' => $view,
            'name' => $name,
            'email' => $email,
            'error' => $error
        ]);
    }

    /**
     * @Route("/login/recover/{email}/{hash}", name="recoverConfirm")
     */
    public function recoverConfirm ($email, $hash, LoginAuthenticator $authenticator, GuardAuthenticatorHandler $guardHandler, Request $request, UserPasswordEncoderInterface $encoder): Response
    {
        $view = $request->request->get('view');
        $name = NULL;
        $email = urldecode($email);
        $error = NULL;

        $uzer = $this->getDoctrine()->getRepository(Uzer::class)
                     ->findOneBy(['email' => $email]);
        if (!$uzer)
        {
            $view = 'recover3fail';
            $error = 'Datos inválidos';
        }
        else
        {
            $hash2 = hash('sha1', $email . 'photoko' . $uzer->getName());
            if ($hash !== $hash2)
            {
                $view = 'recover3fail';
                $error = 'Datos inválidos';
            }
            else
            {
                switch ($view) {
                    case 'recover3':
                        $password = $request->request->get('password');
                        if (empty($password))
                        {
                            $error = 'Datos inválidos';
                        }
                        else
                        {
                            $encPassword = $encoder->encodePassword($uzer, $password);
                            $uzer->setPassword($encPassword);
                            $entityManager = $this->getDoctrine()->getManager();
                            $entityManager->persist($uzer);
                            $entityManager->flush();
                            $view = 'recover4';
                        }
                        break;
                    case 'recover4':
                        return $guardHandler->authenticateUserAndHandleSuccess(
                            $uzer,
                            $request,
                            $authenticator,
                            'main'
                        );
                        break;
                    default:
                        $view = 'recover3';
                        break;
                }
            }
        }
        return $this->render('web/login.html.twig', [
            'view' => $view,
            'name' => $name,
            'email' => $email,
            'error' => $error
        ]);
    }
}
