from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0002_withdrawal_reviewed_by"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key",        models.CharField(db_index=True, max_length=100, unique=True)),
                ("value",      models.TextField(blank=True)),
                ("label",      models.CharField(blank=True, help_text="Human-readable label for admin UI.", max_length=255)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "site setting",
                "verbose_name_plural": "site settings",
                "ordering": ["key"],
            },
        ),
    ]
