# Multi-stage Docker build for BanquetHub Backend (Spring Boot 3 + Java 21)
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/banquet-hub-api-*.jar app.jar
ENV TZ=Asia/Ho_Chi_Minh
EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=Asia/Ho_Chi_Minh", "-jar", "app.jar"]
