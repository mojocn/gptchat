---
layout: post
title:  "Rust笔记:04-Rust对Postgres增删改查"
category: Rust
tags: Rust笔记
keywords: 'Rust对Postgres增删改查 slqx crud'
description: 'Rust对Postgres增删改查 slqx crud'
permalink: /:categories/:title
date: 2022-06-24T10:58:54+08:00
---

```rust
use sqlx::{postgres::{PgPool}};
use std::{ sync::Arc};
use serde::Serialize;
use sqlx::{Result};


#[derive(sqlx::FromRow, Debug, Serialize)]
pub struct App {
    id:String,
    name:String,
    secret_key:String,
    description:String,
    creator_email:String,
}

// CREATE TABLE IF NOT EXISTS apps (
//     id          CHARACTER(128) PRIMARY KEY,
//     name CHARACTER(128)    NOT NULL,
//     secret_key CHARACTER(128)    NOT NULL,
//     creator_email CHARACTER(128)    NOT NULL,
//     description TEXT    NOT NULL
// );
// DATABASE_URL="postgres://postgres:123456@mypg:5432/fateway"




pub struct AppRepo {
    pg_pool: Arc<PgPool>,
}

impl AppRepo {
    pub fn new(pg_pool: PgPool) -> Self {
        Self {
            pg_pool: Arc::new(pg_pool),
        }
    }

    pub async  fn insert(&self, arg: App) -> Result<String> {
        let rec = sqlx::query!(
            r#"INSERT INTO apps ( id, name, secret_key, creator_email, description ) VALUES ( $1, $2, $3, $4, $5 ) RETURNING id"#,
            arg.id,arg.name,arg.secret_key,arg.creator_email,arg.description
        )
        .fetch_one(&*self.pg_pool)
        .await?;
        Ok(rec.id)
    }
    
    pub async  fn update(&self, arg:  App) -> Result<bool> {
        let rows_affected = sqlx::query!(
            r#"UPDATE apps SET  name = $2, secret_key = $3, creator_email = $4, description = $5  WHERE id = $1 "#,
            arg.id,arg.name,arg.secret_key,arg.creator_email,arg.description
        )
        .execute(&*self.pg_pool)
        .await? .rows_affected();
        Ok(rows_affected > 0)
    }
    pub async  fn delete(&self, id:  String ) -> Result<u64> {
        let rows_affected = sqlx::query!(
            r#"DELETE FROM apps WHERE id = $1 "#,
            id
        )
        .execute(&*self.pg_pool)
        .await? .rows_affected();
        Ok(rows_affected)
    }

    pub async  fn list(&self)->Result<Vec<App>> {
        sqlx::query_as::<_, App>("SELECT * FROM apps ORDER BY $1").bind("id").fetch_all(&*self.pg_pool).await
    }

    pub async  fn get(&self, id: String)-> Result<Option<App>>{
         sqlx::query_as!(
            App,    
                    "SELECT * FROM apps WHERE id = $1",id
        ).fetch_optional(&*self.pg_pool).await
    }

}



#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mocked_add() {


        let pg_url = "postgres://postgres:123456@mypg:5432/fateway";
        let pool = PgPool::connect(pg_url).await.unwrap();


    
        let repo = AppRepo::new(pool);

        let apps = repo.list().await.unwrap();
        println!("{:?}",apps);
        let some_app = App{
            id: "an2y-id-is-ok-91".to_string(),
            name: "eric".to_string(),
            secret_key: "sk".to_string(),
            description: "description".to_string(),
            creator_email:  "neochau@gmail.com".to_string(),
        };
        let id= repo.insert(some_app).await.unwrap();

        repo.get(id).await.unwrap();
    }
}

```