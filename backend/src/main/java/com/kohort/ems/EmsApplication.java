package com.kohort.ems;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.File;

@SpringBootApplication
@EnableScheduling
public class EmsApplication {

	public static void main(String[] args) {
		// Load .env from backend/ or project root directory if available
		Dotenv dotenv;
		if (new File(".env").exists()) {
			dotenv = Dotenv.configure().load();
		} else if (new File("../.env").exists()) {
			dotenv = Dotenv.configure().directory("../").load();
		} else {
			dotenv = Dotenv.configure().ignoreIfMissing().load();
		}

		dotenv.entries().forEach(entry -> {
			String key = entry.getKey();
			String value = entry.getValue();

			// Auto-fix URL: If copied as postgresql://... ensure jdbc: prefix for JDBC driver
			if (("SPRING_DATASOURCE_URL".equalsIgnoreCase(key) || "DATABASE_URL".equalsIgnoreCase(key))
					&& value != null && value.startsWith("postgresql://")) {
				value = "jdbc:" + value;
			}

			// Set system property so Spring Boot application.yml resolves ${KEY}
			if (System.getProperty(key) == null && System.getenv(key) == null) {
				System.setProperty(key, value);
			}
		});

		SpringApplication.run(EmsApplication.class, args);
	}

}
