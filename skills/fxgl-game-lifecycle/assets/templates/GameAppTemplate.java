package com.example;

import com.almasb.fxgl.app.GameApplication;
import com.almasb.fxgl.app.GameSettings;
import com.almasb.fxgl.app.ApplicationMode;
import com.almasb.fxgl.app.MenuItem;
import javafx.scene.input.KeyCode;
import javafx.scene.paint.Color;
import java.util.EnumSet;
import java.util.Map;

import static com.almasb.fxgl.dsl.FXGL.*;

/**
 * Full FXGL GameApplication template with all lifecycle hooks.
 * Delete hooks you don't need — they are all optional except initSettings.
 */
public class GameAppTemplate extends GameApplication {

    // ─── Settings ────────────────────────────────────────────────────────────

    @Override
    protected void initSettings(GameSettings settings) {
        settings.setWidth(1280);
        settings.setHeight(720);
        settings.setTitle("My FXGL Game");
        settings.setVersion("1.0");

        settings.setApplicationMode(ApplicationMode.DEVELOPER); // RELEASE for production
        settings.setDeveloperMenuEnabled(true);  // F1 pane
        settings.setMainMenuEnabled(true);
        settings.setGameMenuEnabled(true);
        settings.setEnabledMenuItems(EnumSet.allOf(MenuItem.class));
    }

    // ─── Variables ───────────────────────────────────────────────────────────

    @Override
    protected void initGameVars(Map<String, Object> vars) {
        vars.put("score", 0);
        vars.put("lives", 3);
        vars.put("level", 1);
    }

    // ─── Input ───────────────────────────────────────────────────────────────

    @Override
    protected void initInput() {
        onKey(KeyCode.A, () -> { /* move left */ });
        onKey(KeyCode.D, () -> { /* move right */ });
        onKeyDown(KeyCode.SPACE, () -> { /* jump / shoot */ });
    }

    // ─── Game World ──────────────────────────────────────────────────────────

    @Override
    protected void initGame() {
        getGameWorld().addEntityFactory(new MyEntityFactory());
        setLevelFromMap("level1.tmx");
        spawn("player", 100, 100);
    }

    // ─── Physics ─────────────────────────────────────────────────────────────

    @Override
    protected void initPhysics() {
        getPhysicsWorld().setGravity(0, 980);

        onCollisionBegin(EntityType.PLAYER, EntityType.COIN, (player, coin) -> {
            coin.removeFromWorld();
            inc("score", +10);
        });
    }

    // ─── HUD ─────────────────────────────────────────────────────────────────

    @Override
    protected void initUI() {
        var scoreText = getUIFactoryService().newText("", Color.WHITE, 22.0);
        scoreText.textProperty().bind(getip("score").asString("Score: %d"));
        addUINode(scoreText, 20, 40);
    }

    // ─── Game Loop ───────────────────────────────────────────────────────────

    @Override
    protected void onUpdate(double tpf) {
        // frame-rate-independent updates here
    }

    // ─── Entry Point ─────────────────────────────────────────────────────────

    public static void main(String[] args) {
        launch(args);
    }

    // ─── Placeholder types (replace with your own) ───────────────────────────

    enum EntityType { PLAYER, COIN, ENEMY }
    static class MyEntityFactory implements com.almasb.fxgl.entity.EntityFactory {}
}
