-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema supachat
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema supachat
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `supachat` DEFAULT CHARACTER SET utf8 ;
USE `supachat` ;

-- -----------------------------------------------------
-- Table `supachat`.`messages`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `supachat`.`messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `message` VARCHAR(500) NOT NULL,
  `room_id` INT(11) NULL DEFAULT NULL,
  `author_id` INT(50) NOT NULL,
  `room` VARCHAR(45) NULL DEFAULT NULL,
  `timestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `author` VARCHAR(45) NOT NULL,
  `recepient` VARCHAR(45) NULL DEFAULT NULL,
  `recepient_id` INT(50) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 89
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `supachat`.`rooms`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `supachat`.`rooms` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `owner_id` INT(50) NULL DEFAULT NULL,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 50
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `supachat`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `supachat`.`users` (
  `id` INT(50) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 49
DEFAULT CHARACTER SET = utf8;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
