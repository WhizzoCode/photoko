<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\PhotoRepository")
 */
class Photo
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\Uzer", inversedBy="photos")
     * @ORM\JoinColumn(nullable=true)
     */
    private $uzer;

    /**
     * @ORM\Column(type="datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="json", nullable=true)
     */
    private $edition = [];

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUzer(): ?Uzer
    {
        return $this->uzer;
    }

    public function setUzer(?Uzer $uzer): self
    {
        $this->uzer = $uzer;

        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): self
    {
        $this->date = $date;

        return $this;
    }

    public function getEdition(): ?array
    {
        return $this->edition;
    }

    public function setEdition(?array $edition): self
    {
        $this->edition = $edition;

        return $this;
    }
}
