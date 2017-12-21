/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Leagues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `League` char(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedOn` int(10) unsigned NOT NULL,
  `Data` mediumtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `League` (`League`),
  KEY `CreatedOn` (`CreatedOn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
