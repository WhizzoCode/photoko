<?php

namespace App\Repository;

use App\Entity\Uzer;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Symfony\Bridge\Doctrine\RegistryInterface;

/**
 * @method Uzer|null find($id, $lockMode = null, $lockVersion = null)
 * @method Uzer|null findOneBy(array $criteria, array $orderBy = null)
 * @method Uzer[]    findAll()
 * @method Uzer[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UzerRepository extends ServiceEntityRepository
{
    public function __construct(RegistryInterface $registry)
    {
        parent::__construct($registry, Uzer::class);
    }

    public function findAllByLastseen()
    {
        return $this->createQueryBuilder('u')
            ->orderBy('u.lastseen', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }

    // /**
    //  * @return Uzer[] Returns an array of Uzer objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('u.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?Uzer
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
